/**
 * useRazorpay Hook
 * Handles Razorpay payment flow for wallet recharge
 *
 * IMPORTANT: This hook requires a development build (not Expo Go).
 * Run: npx expo prebuild && npx expo run:android
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform, NativeModules } from 'react-native';
import { walletService } from '../services/wallet.service';
import { RAZORPAY_CONFIG, RAZORPAY_ERRORS } from '../config/razorpay.config';

// Import Razorpay and check native module availability
let RazorpayCheckout: any = null;
let isNativeModuleAvailable = false;

try {
  RazorpayCheckout = require('react-native-razorpay').default;
  // Check if the native module is actually linked
  isNativeModuleAvailable = NativeModules.RNRazorpayCheckout != null;

  if (!isNativeModuleAvailable) {
    console.warn(
      '[Razorpay] Native module not found. This usually means:\n' +
      '1. You are running in Expo Go (use development build instead)\n' +
      '2. Native modules are not linked. Run: npx expo prebuild --clean && npx expo run:android'
    );
  }
} catch (e) {
  console.warn('[Razorpay] Package not installed. Run: npx expo install react-native-razorpay');
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
}

interface UseRazorpayReturn {
  processPayment: (amount: number) => Promise<PaymentResult>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  isAvailable: boolean;
}

export const useRazorpay = (): UseRazorpayReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(async (amount: number): Promise<PaymentResult> => {
    setLoading(true);
    setError(null);

    try {
      // Validate amount
      if (amount < RAZORPAY_CONFIG.MIN_AMOUNT) {
        throw new Error(`Minimum recharge amount is ₹${RAZORPAY_CONFIG.MIN_AMOUNT}`);
      }
      if (amount > RAZORPAY_CONFIG.MAX_AMOUNT) {
        throw new Error(`Maximum recharge amount is ₹${RAZORPAY_CONFIG.MAX_AMOUNT}`);
      }

      // Check if Razorpay native module is available
      if (!RazorpayCheckout || !isNativeModuleAvailable) {
        console.error('[Razorpay] Native module not available');

        const errorMessage = Platform.select({
          android: 'Payment gateway not available.\n\nPlease ensure you are running a development build, not Expo Go.\n\nRun: npx expo run:android',
          ios: 'Payment gateway not available.\n\nPlease ensure you are running a development build, not Expo Go.\n\nRun: npx expo run:ios',
          default: 'Payment gateway not available on this platform.',
        });

        Alert.alert(
          'Payment Unavailable',
          errorMessage,
          [{ text: 'OK' }]
        );

        setLoading(false);
        return {
          success: false,
          error: 'Native payment module not available. Use a development build.',
        };
      }

      // Step 1: Initiate recharge and get Razorpay order
      const initiateResponse = await walletService.initiateRecharge(amount);

      if (!initiateResponse || !initiateResponse.orderId) {
        throw new Error(RAZORPAY_ERRORS.ORDER_CREATION_FAILED);
      }

      const { orderId, keyId, amountInPaise, currency, prefill } = initiateResponse;

      // Step 2: Configure Razorpay options
      const options = {
        key: keyId || RAZORPAY_CONFIG.KEY_ID,
        amount: amountInPaise,
        currency: currency || RAZORPAY_CONFIG.CURRENCY,
        name: RAZORPAY_CONFIG.NAME,
        description: RAZORPAY_CONFIG.DESCRIPTION,
        image: RAZORPAY_CONFIG.IMAGE,
        order_id: orderId,
        prefill: {
          name: prefill?.name || '',
          email: prefill?.email || '',
          contact: prefill?.contact || '',
        },
        theme: {
          color: RAZORPAY_CONFIG.THEME_COLOR,
        },
        // Android-specific options
        ...(Platform.OS === 'android' && {
          external: {
            wallets: ['paytm'],
          },
        }),
      };

      // Step 3: Open Razorpay checkout
      const paymentResponse = await RazorpayCheckout.open(options);

      // Step 4: Verify payment with backend
      const verifyResponse = await walletService.verifyPayment({
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      if (!verifyResponse.success) {
        throw new Error(verifyResponse.message || RAZORPAY_ERRORS.VERIFICATION_FAILED);
      }

      setLoading(false);
      return {
        success: true,
        transactionId: verifyResponse.transactionId,
        newBalance: verifyResponse.newBalance,
      };

    } catch (err: any) {
      setLoading(false);

      // Handle Razorpay specific errors
      let errorMessage = RAZORPAY_ERRORS.PAYMENT_FAILED;

      if (err.code === 'PAYMENT_CANCELLED' || err.description?.includes('cancelled')) {
        errorMessage = RAZORPAY_ERRORS.PAYMENT_CANCELLED;
      } else if (err.description) {
        errorMessage = err.description;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    processPayment,
    loading,
    error,
    clearError,
    isAvailable: isNativeModuleAvailable,
  };
};
