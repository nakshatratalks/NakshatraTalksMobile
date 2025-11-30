# NakshatraTalks Wallet Integration Guide

Complete guide for integrating the wallet and payment system in your React Native and Next.js applications.

---

## Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [API Endpoints Reference](#2-api-endpoints-reference)
3. [Payment Flow Overview](#3-payment-flow-overview)
4. [React Native Integration](#4-react-native-integration)
5. [Next.js Web Integration](#5-nextjs-web-integration)
6. [Webhook Configuration](#6-webhook-configuration)
7. [Error Handling](#7-error-handling)
8. [Testing Guide](#8-testing-guide)
9. [Security Best Practices](#9-security-best-practices)

---

## 1. Environment Setup

### Backend Configuration

Add these environment variables to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_8DmfRFT3ZEhV7F
RAZORPAY_KEY_SECRET=<get from backend team - never commit to git>
RAZORPAY_WEBHOOK_SECRET=<get from backend team - never commit to git>
```

### Getting Razorpay Credentials

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings → API Keys**
3. Generate a new API key pair (Test Mode for development)
4. Copy the Key ID and Key Secret
5. For webhook secret: Go to **Settings → Webhooks → Create Webhook**

### Frontend Configuration

```typescript
// config/razorpay.ts
export const RAZORPAY_CONFIG = {
  KEY_ID: 'rzp_test_8DmfRFT3ZEhV7F', // NakshatraTalks Razorpay Key ID
  CURRENCY: 'INR',
  NAME: 'NakshatraTalks',
  DESCRIPTION: 'Wallet Recharge',
  IMAGE: 'https://your-domain.com/logo.png',
  THEME_COLOR: '#FFC107',
};
```

---

## 2. API Endpoints Reference

### Base URL
```
Development: http://localhost:4000/api/v1
Production: https://your-api-domain.com/api/v1
```

### Authentication
All endpoints (except webhooks) require Bearer token authentication:
```
Authorization: Bearer <firebase_id_token>
```

### User Wallet Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wallet/balance` | Get current wallet balance |
| `GET` | `/wallet/summary` | Get balance, stats, recent transactions |
| `GET` | `/wallet/recharge-options` | Get predefined recharge amounts |
| `POST` | `/wallet/recharge/initiate` | Create payment order |
| `POST` | `/wallet/recharge/verify` | Verify payment & credit wallet |
| `GET` | `/wallet/transactions` | Get transaction history |
| `GET` | `/wallet/recharges` | Get recharge history only |
| `GET` | `/wallet/orders/pending` | Get pending orders |
| `POST` | `/wallet/orders/:orderId/cancel` | Cancel pending order |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wallet/admin/transactions` | Get all transactions |
| `POST` | `/wallet/admin/credit` | Manual wallet credit |
| `POST` | `/wallet/admin/debit` | Manual wallet debit |
| `POST` | `/wallet/admin/refund` | Process refund |

---

## 3. Payment Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     WALLET RECHARGE FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User selects amount                                         │
│         │                                                       │
│         ▼                                                       │
│  2. POST /wallet/recharge/initiate                              │
│     Request: { amount: 500 }                                    │
│     Response: { orderId, keyId, amount, prefill }               │
│         │                                                       │
│         ▼                                                       │
│  3. Open Razorpay Checkout (Frontend)                           │
│     - User enters card/UPI details                              │
│     - Payment processed by Razorpay                             │
│         │                                                       │
│         ├──────────────────┬────────────────────┐               │
│         │                  │                    │               │
│         ▼                  ▼                    ▼               │
│    [Success]           [Failed]            [Cancelled]          │
│         │                  │                    │               │
│         ▼                  │                    │               │
│  4. POST /wallet/recharge/verify               │               │
│     { razorpayOrderId,     │                    │               │
│       razorpayPaymentId,   │                    │               │
│       razorpaySignature }  │                    │               │
│         │                  │                    │               │
│         ▼                  ▼                    ▼               │
│  5. Wallet Credited    Show Error         Return to App         │
│     Show Success                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

           BACKUP: Webhook also credits wallet if
           frontend verification fails
```

---

## 4. React Native Integration

### Install Dependencies

```bash
npm install react-native-razorpay
# or
yarn add react-native-razorpay

# iOS
cd ios && pod install
```

### Android Setup

Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.razorpay:checkout:1.6.33'
}
```

### iOS Setup

No additional setup required after pod install.

### API Service

```typescript
// services/api/wallet.ts
import { API_BASE_URL } from '@/config/api';
import { getAuthToken } from '@/utils/auth';

const getHeaders = async () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${await getAuthToken()}`,
});

// Get wallet balance
export const getWalletBalance = async () => {
  const response = await fetch(`${API_BASE_URL}/wallet/balance`, {
    headers: await getHeaders(),
  });
  return response.json();
};

// Get wallet summary (balance + stats + recent transactions)
export const getWalletSummary = async () => {
  const response = await fetch(`${API_BASE_URL}/wallet/summary`, {
    headers: await getHeaders(),
  });
  return response.json();
};

// Get recharge options
export const getRechargeOptions = async () => {
  const response = await fetch(`${API_BASE_URL}/wallet/recharge-options`, {
    headers: await getHeaders(),
  });
  return response.json();
};

// Initiate recharge - creates Razorpay order
export const initiateRecharge = async (amount: number) => {
  const response = await fetch(`${API_BASE_URL}/wallet/recharge/initiate`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ amount }),
  });
  return response.json();
};

// Verify payment after Razorpay checkout
export const verifyPayment = async (paymentData: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/wallet/recharge/verify`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(paymentData),
  });
  return response.json();
};

// Get transaction history
export const getTransactionHistory = async (params?: {
  page?: number;
  limit?: number;
  type?: 'recharge' | 'debit' | 'refund';
  status?: 'pending' | 'success' | 'failed' | 'completed';
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.type) queryParams.append('type', params.type);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const response = await fetch(
    `${API_BASE_URL}/wallet/transactions?${queryParams}`,
    { headers: await getHeaders() }
  );
  return response.json();
};

// Get recharge history
export const getRechargeHistory = async (params?: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'success' | 'failed';
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);

  const response = await fetch(
    `${API_BASE_URL}/wallet/recharges?${queryParams}`,
    { headers: await getHeaders() }
  );
  return response.json();
};

// Get pending orders
export const getPendingOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/wallet/orders/pending`, {
    headers: await getHeaders(),
  });
  return response.json();
};

// Cancel pending order
export const cancelPendingOrder = async (orderId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/wallet/orders/${orderId}/cancel`,
    {
      method: 'POST',
      headers: await getHeaders(),
    }
  );
  return response.json();
};
```

### Razorpay Hook

```typescript
// hooks/useRazorpay.ts
import { useState, useCallback } from 'react';
import RazorpayCheckout from 'react-native-razorpay';
import { initiateRecharge, verifyPayment } from '@/services/api/wallet';
import { RAZORPAY_CONFIG } from '@/config/razorpay';

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
}

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(async (amount: number): Promise<PaymentResult> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Initiate recharge and get Razorpay order
      const initiateResponse = await initiateRecharge(amount);

      if (!initiateResponse.success) {
        throw new Error(initiateResponse.message || 'Failed to create order');
      }

      const { orderId, keyId, amountInPaise, currency, prefill } = initiateResponse.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: currency,
        name: RAZORPAY_CONFIG.NAME,
        description: RAZORPAY_CONFIG.DESCRIPTION,
        image: RAZORPAY_CONFIG.IMAGE,
        order_id: orderId,
        prefill: {
          name: prefill.name,
          email: prefill.email,
          contact: prefill.contact,
        },
        theme: {
          color: RAZORPAY_CONFIG.THEME_COLOR,
        },
      };

      const paymentResponse = await RazorpayCheckout.open(options);

      // Step 3: Verify payment with backend
      const verifyResponse = await verifyPayment({
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      if (!verifyResponse.success) {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }

      setLoading(false);
      return {
        success: true,
        transactionId: verifyResponse.data.transactionId,
        newBalance: verifyResponse.data.newBalance,
      };

    } catch (err: any) {
      const errorMessage = err.description || err.message || 'Payment failed';
      setError(errorMessage);
      setLoading(false);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  return {
    processPayment,
    loading,
    error,
    clearError: () => setError(null),
  };
};
```

### Wallet Screen Component

```tsx
// screens/WalletScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRazorpay } from '@/hooks/useRazorpay';
import {
  getWalletSummary,
  getTransactionHistory,
} from '@/services/api/wallet';

// Predefined recharge amounts
const RECHARGE_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

interface Transaction {
  id: string;
  type: 'recharge' | 'debit' | 'refund';
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  pendingOrders: number;
  stats: {
    last30Days: {
      totalSpent: number;
      totalRecharged: number;
    };
  };
  recentTransactions: Transaction[];
}

export const WalletScreen: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const { processPayment, loading: paymentLoading } = useRazorpay();

  // Fetch wallet data
  const fetchWalletData = useCallback(async () => {
    try {
      const [summaryRes, transactionsRes] = await Promise.all([
        getWalletSummary(),
        getTransactionHistory({ limit: 20 }),
      ]);

      if (summaryRes.success) {
        setWalletData(summaryRes.data);
      }

      if (transactionsRes.success) {
        setTransactions(transactionsRes.data);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  }, [fetchWalletData]);

  // Handle recharge
  const handleRecharge = async () => {
    const amount = selectedAmount || parseInt(customAmount, 10);

    if (!amount || amount < 50) {
      Alert.alert('Invalid Amount', 'Minimum recharge amount is ₹50');
      return;
    }

    if (amount > 50000) {
      Alert.alert('Invalid Amount', 'Maximum recharge amount is ₹50,000');
      return;
    }

    const result = await processPayment(amount);

    if (result.success) {
      Alert.alert(
        'Payment Successful',
        `₹${amount} added to your wallet!\nNew Balance: ₹${result.newBalance}`,
        [{ text: 'OK', onPress: fetchWalletData }]
      );
      setSelectedAmount(null);
      setCustomAmount('');
    } else {
      Alert.alert('Payment Failed', result.error || 'Something went wrong');
    }
  };

  // Render transaction item
  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionType}>
          {item.type === 'recharge' ? '💰 Added' :
           item.type === 'debit' ? '📞 Consultation' : '↩️ Refund'}
        </Text>
        <Text style={styles.transactionDesc}>{item.description}</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: item.amount >= 0 ? '#28A745' : '#DC3545' }
        ]}>
          {item.amount >= 0 ? '+' : ''}₹{Math.abs(item.amount)}
        </Text>
        <Text style={[
          styles.transactionStatus,
          { color: item.status === 'success' || item.status === 'completed'
            ? '#28A745' : item.status === 'pending' ? '#FFC107' : '#DC3545' }
        ]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>
          ₹{walletData?.balance?.toFixed(2) || '0.00'}
        </Text>
        {walletData?.pendingOrders > 0 && (
          <Text style={styles.pendingText}>
            {walletData.pendingOrders} pending order(s)
          </Text>
        )}
      </View>

      {/* Stats */}
      {walletData?.stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Spent (30 days)</Text>
            <Text style={styles.statValue}>
              ₹{walletData.stats.last30Days.totalSpent}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Recharged (30 days)</Text>
            <Text style={styles.statValue}>
              ₹{walletData.stats.last30Days.totalRecharged}
            </Text>
          </View>
        </View>
      )}

      {/* Recharge Section */}
      <View style={styles.rechargeSection}>
        <Text style={styles.sectionTitle}>Add Money</Text>

        <View style={styles.amountGrid}>
          {RECHARGE_AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.amountButton,
                selectedAmount === amount && styles.amountButtonSelected,
              ]}
              onPress={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
            >
              <Text style={[
                styles.amountText,
                selectedAmount === amount && styles.amountTextSelected,
              ]}>
                ₹{amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.rechargeButton,
            (!selectedAmount && !customAmount) && styles.rechargeButtonDisabled,
          ]}
          onPress={handleRecharge}
          disabled={paymentLoading || (!selectedAmount && !customAmount)}
        >
          <Text style={styles.rechargeButtonText}>
            {paymentLoading ? 'Processing...' : 'Add Money'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transaction History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Transaction History</Text>

        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions yet</Text>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  balanceCard: {
    backgroundColor: '#192A56',
    padding: 24,
    margin: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#FFFFFF80',
    fontSize: 14,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
  },
  pendingText: {
    color: '#FFC107',
    fontSize: 12,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
  },
  statValue: {
    color: '#192A56',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  rechargeSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#192A56',
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  amountButtonSelected: {
    borderColor: '#FFC107',
    backgroundColor: '#FFF8E1',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#192A56',
  },
  amountTextSelected: {
    color: '#FFC107',
  },
  rechargeButton: {
    backgroundColor: '#FFC107',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  rechargeButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  rechargeButtonText: {
    color: '#192A56',
    fontSize: 16,
    fontWeight: '600',
  },
  historySection: {
    flex: 1,
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#192A56',
  },
  transactionDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  transactionDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionStatus: {
    fontSize: 11,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
  },
});
```

---

## 5. Next.js Web Integration

### Install Razorpay Script

```tsx
// app/layout.tsx or pages/_document.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### TypeScript Declarations

```typescript
// types/razorpay.d.ts
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface Razorpay {
  new (options: RazorpayOptions): {
    open: () => void;
    close: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: Razorpay;
  }
}
```

### API Service (Web)

```typescript
// lib/api/wallet.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken'); // or use your auth method

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export async function getWalletSummary() {
  const res = await fetchWithAuth(`${API_BASE_URL}/wallet/summary`);
  return res.json();
}

export async function getRechargeOptions() {
  const res = await fetchWithAuth(`${API_BASE_URL}/wallet/recharge-options`);
  return res.json();
}

export async function initiateRecharge(amount: number) {
  const res = await fetchWithAuth(`${API_BASE_URL}/wallet/recharge/initiate`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return res.json();
}

export async function verifyPayment(data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const res = await fetchWithAuth(`${API_BASE_URL}/wallet/recharge/verify`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getTransactionHistory(params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.type) searchParams.set('type', params.type);
  if (params?.status) searchParams.set('status', params.status);

  const res = await fetchWithAuth(
    `${API_BASE_URL}/wallet/transactions?${searchParams}`
  );
  return res.json();
}
```

### Razorpay Hook (Web)

```typescript
// hooks/useRazorpay.ts
'use client';

import { useState, useCallback } from 'react';
import { initiateRecharge, verifyPayment } from '@/lib/api/wallet';

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(async (amount: number): Promise<PaymentResult> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create order
      const orderResponse = await initiateRecharge(amount);

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create order');
      }

      const { orderId, keyId, amountInPaise, currency, prefill } = orderResponse.data;

      // Step 2: Open Razorpay checkout
      return new Promise((resolve) => {
        const options: RazorpayOptions = {
          key: keyId,
          amount: amountInPaise,
          currency: currency,
          name: 'NakshatraTalks',
          description: 'Wallet Recharge',
          order_id: orderId,
          prefill: {
            name: prefill.name,
            email: prefill.email,
            contact: prefill.contact,
          },
          theme: {
            color: '#FFC107',
          },
          handler: async (response) => {
            try {
              // Step 3: Verify payment
              const verifyResponse = await verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              setLoading(false);

              if (verifyResponse.success) {
                resolve({
                  success: true,
                  transactionId: verifyResponse.data.transactionId,
                  newBalance: verifyResponse.data.newBalance,
                });
              } else {
                resolve({
                  success: false,
                  error: verifyResponse.message || 'Verification failed',
                });
              }
            } catch (err: any) {
              setLoading(false);
              resolve({
                success: false,
                error: err.message || 'Verification failed',
              });
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              resolve({
                success: false,
                error: 'Payment cancelled',
              });
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      });
    } catch (err: any) {
      setLoading(false);
      setError(err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }, []);

  return {
    processPayment,
    loading,
    error,
    clearError: () => setError(null),
  };
}
```

### Wallet Page Component (Web)

```tsx
// app/wallet/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRazorpay } from '@/hooks/useRazorpay';
import { getWalletSummary, getTransactionHistory } from '@/lib/api/wallet';

const RECHARGE_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export default function WalletPage() {
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { processPayment, loading: paymentLoading } = useRazorpay();

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, txnRes] = await Promise.all([
          getWalletSummary(),
          getTransactionHistory({ limit: 20 }),
        ]);

        if (summaryRes.success) setWalletData(summaryRes.data);
        if (txnRes.success) setTransactions(txnRes.data);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleRecharge = async () => {
    const amount = selectedAmount || parseInt(customAmount, 10);

    if (!amount || amount < 50) {
      alert('Minimum recharge amount is ₹50');
      return;
    }

    const result = await processPayment(amount);

    if (result.success) {
      alert(`Payment successful! New balance: ₹${result.newBalance}`);
      // Refresh wallet data
      const summaryRes = await getWalletSummary();
      if (summaryRes.success) setWalletData(summaryRes.data);

      const txnRes = await getTransactionHistory({ limit: 20 });
      if (txnRes.success) setTransactions(txnRes.data);

      setSelectedAmount(null);
      setCustomAmount('');
    } else {
      alert(`Payment failed: ${result.error}`);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Balance Card */}
      <div className="bg-[#192A56] text-white rounded-2xl p-8 mb-6">
        <p className="text-white/60 text-sm">Wallet Balance</p>
        <p className="text-4xl font-bold mt-2">
          ₹{walletData?.balance?.toFixed(2) || '0.00'}
        </p>
        {walletData?.pendingOrders > 0 && (
          <p className="text-yellow-400 text-sm mt-2">
            {walletData.pendingOrders} pending order(s)
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Spent (30 days)</p>
          <p className="text-xl font-semibold text-[#192A56]">
            ₹{walletData?.stats?.last30Days?.totalSpent || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Recharged (30 days)</p>
          <p className="text-xl font-semibold text-[#192A56]">
            ₹{walletData?.stats?.last30Days?.totalRecharged || 0}
          </p>
        </div>
      </div>

      {/* Recharge Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-[#192A56] mb-4">Add Money</h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {RECHARGE_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
              className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                selectedAmount === amount
                  ? 'border-[#FFC107] bg-yellow-50 text-[#FFC107]'
                  : 'border-gray-200 text-[#192A56] hover:border-gray-300'
              }`}
            >
              ₹{amount}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <input
            type="number"
            placeholder="Or enter custom amount (₹50 - ₹50,000)"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
            }}
            className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
          />
        </div>

        <button
          onClick={handleRecharge}
          disabled={paymentLoading || (!selectedAmount && !customAmount)}
          className="w-full bg-[#FFC107] text-[#192A56] font-semibold py-4 rounded-xl hover:bg-yellow-500 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          {paymentLoading ? 'Processing...' : 'Add Money'}
        </button>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#192A56] mb-4">
          Transaction History
        </h2>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No transactions yet</p>
          ) : (
            transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-[#192A56]">
                    {txn.type === 'recharge' ? '💰 Added' :
                     txn.type === 'debit' ? '📞 Consultation' : '↩️ Refund'}
                  </p>
                  <p className="text-sm text-gray-500">{txn.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(txn.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    txn.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {txn.amount >= 0 ? '+' : ''}₹{Math.abs(txn.amount)}
                  </p>
                  <p className={`text-xs uppercase ${
                    txn.status === 'success' || txn.status === 'completed'
                      ? 'text-green-600'
                      : txn.status === 'pending'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {txn.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Webhook Configuration

### Setting Up Razorpay Webhooks

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings → Webhooks**
3. Click **Add New Webhook**
4. Configure:
   - **Webhook URL**: `https://your-api-domain.com/webhooks/razorpay`
   - **Secret**: Generate a strong secret and save it to `RAZORPAY_WEBHOOK_SECRET`
   - **Active Events**:
     - `payment.authorized`
     - `payment.captured`
     - `payment.failed`
     - `refund.created`
     - `refund.processed`

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `payment.authorized` | Credits wallet if pending transaction exists |
| `payment.captured` | Credits wallet if pending transaction exists |
| `payment.failed` | Marks transaction as failed |
| `refund.created` | Logs refund initiation |
| `refund.processed` | Logs refund completion |

### Testing Webhooks Locally

Use [ngrok](https://ngrok.com/) to expose your local server:

```bash
# Terminal 1: Start your server
npm run dev

# Terminal 2: Start ngrok
ngrok http 4000
```

Then use the ngrok URL (e.g., `https://abc123.ngrok.io/webhooks/razorpay`) in Razorpay Dashboard.

---

## 7. Error Handling

### Common Error Codes

| Code | Description | User Message |
|------|-------------|--------------|
| `VALIDATION_ERROR` | Invalid input data | "Please check your input" |
| `UNAUTHORIZED` | Not authenticated | "Please login to continue" |
| `NOT_FOUND` | Resource not found | "Transaction not found" |
| `INSUFFICIENT_BALANCE` | Not enough balance | "Please recharge your wallet" |
| `PAYMENT_FAILED` | Razorpay payment failed | "Payment failed. Please try again" |
| `SIGNATURE_INVALID` | Invalid payment signature | "Payment verification failed" |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Minimum recharge amount is ₹50"
  }
}
```

### Frontend Error Handling

```typescript
// utils/handleApiError.ts
export function handleApiError(error: any): string {
  // Network error
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }

  // API error
  const message = error.response?.data?.error?.message
    || error.response?.data?.message
    || 'Something went wrong';

  return message;
}

// Usage in component
try {
  const result = await processPayment(amount);
  // handle success
} catch (error) {
  const message = handleApiError(error);
  Alert.alert('Error', message);
}
```

---

## 8. Testing Guide

### Test Mode Credentials

Use Razorpay test mode credentials for development:

- **Test Key ID**: `rzp_test_xxxxxxxxxxxxxx`
- **Test Key Secret**: Available in Razorpay dashboard

### Test Card Numbers

| Card Number | Description |
|-------------|-------------|
| `4111 1111 1111 1111` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `5267 3181 8797 5449` | Mastercard success |

### Test UPI IDs

| UPI ID | Description |
|--------|-------------|
| `success@razorpay` | Successful payment |
| `failure@razorpay` | Failed payment |

### API Testing with cURL

```bash
# 1. Get wallet balance
curl -X GET "http://localhost:4000/api/v1/wallet/balance" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Get wallet summary
curl -X GET "http://localhost:4000/api/v1/wallet/summary" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Initiate recharge
curl -X POST "http://localhost:4000/api/v1/wallet/recharge/initiate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}'

# 4. Verify payment (after Razorpay checkout)
curl -X POST "http://localhost:4000/api/v1/wallet/recharge/verify" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpayOrderId": "order_xxxxx",
    "razorpayPaymentId": "pay_xxxxx",
    "razorpaySignature": "signature_xxxxx"
  }'

# 5. Get transaction history
curl -X GET "http://localhost:4000/api/v1/wallet/transactions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Admin: Credit wallet
curl -X POST "http://localhost:4000/api/v1/wallet/admin/credit" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "amount": 100,
    "description": "Promotional credit"
  }'
```

---

## 9. Security Best Practices

### 1. Never Expose Secret Keys

```typescript
// ❌ BAD - Don't do this
const RAZORPAY_SECRET = 'your_secret_key';

// ✅ GOOD - Use environment variables
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET;
```

### 2. Always Verify Signatures

The backend already verifies all payment signatures. Never skip this step.

### 3. Validate Amounts Server-Side

```typescript
// Backend validates amount limits
if (amount < MIN_RECHARGE_AMOUNT || amount > MAX_RECHARGE_AMOUNT) {
  throw new Error('Invalid amount');
}
```

### 4. Use HTTPS in Production

Always use HTTPS for webhook URLs and API calls.

### 5. Implement Rate Limiting

The API has rate limiting on sensitive endpoints to prevent abuse.

### 6. Store Minimal Payment Data

We only store:
- Razorpay Order ID
- Razorpay Payment ID
- Transaction status

We do NOT store:
- Card numbers
- CVV
- Bank account details

### 7. Handle Webhook Idempotency

Webhooks may be sent multiple times. The backend handles this by:
- Checking if transaction already processed
- Using unique order IDs
- Preventing duplicate credits

---

## Support

For issues or questions:
- Backend API issues: Check server logs
- Payment issues: Contact Razorpay support
- Integration help: Refer to [Razorpay Docs](https://razorpay.com/docs/)

---

## Changelog

### v1.0.0 (Initial Release)
- Complete wallet management system
- Razorpay payment integration
- Transaction history with filtering
- Admin wallet management
- Webhook support for payment events
