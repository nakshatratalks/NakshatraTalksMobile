/**
 * Wallet Service
 * Handles wallet and transaction operations with Razorpay integration
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import {
  WalletBalance,
  WalletSummary,
  Transaction,
  RechargeData,
  RechargeOption,
  InitiateRechargeResponse,
  VerifyPaymentData,
  VerifyPaymentResponse,
  PendingOrder,
  ApiResponse,
  Pagination,
} from '../types/api.types';

class WalletService {
  /**
   * Get wallet balance
   * @returns Promise<WalletBalance>
   */
  async getBalance(): Promise<WalletBalance> {
    const response = await apiClient.get<ApiResponse<WalletBalance>>(
      API_ENDPOINTS.WALLET.BALANCE
    );
    return response.data!;
  }

  /**
   * Get wallet summary (balance + stats + recent transactions)
   * @returns Promise<WalletSummary>
   */
  async getSummary(): Promise<WalletSummary> {
    const response = await apiClient.get<ApiResponse<WalletSummary>>(
      API_ENDPOINTS.WALLET.SUMMARY
    );
    return response.data!;
  }

  /**
   * Get predefined recharge options
   * @returns Promise<RechargeOption[]>
   */
  async getRechargeOptions(): Promise<RechargeOption[]> {
    const response = await apiClient.get<ApiResponse<RechargeOption[]>>(
      API_ENDPOINTS.WALLET.RECHARGE_OPTIONS
    );
    return response.data || [];
  }

  /**
   * Initiate recharge - creates Razorpay order
   * @param amount - Recharge amount in INR
   * @returns Promise<InitiateRechargeResponse>
   */
  async initiateRecharge(amount: number): Promise<InitiateRechargeResponse> {
    const response = await apiClient.post<ApiResponse<InitiateRechargeResponse>>(
      API_ENDPOINTS.WALLET.RECHARGE_INITIATE,
      { amount }
    );
    return response.data!;
  }

  /**
   * Verify payment after Razorpay checkout
   * @param data - Payment verification data from Razorpay
   * @returns Promise<VerifyPaymentResponse>
   */
  async verifyPayment(data: VerifyPaymentData): Promise<VerifyPaymentResponse> {
    const response = await apiClient.post<ApiResponse<VerifyPaymentResponse>>(
      API_ENDPOINTS.WALLET.RECHARGE_VERIFY,
      data
    );
    return response.data!;
  }

  /**
   * Legacy recharge method (deprecated - use initiateRecharge + verifyPayment)
   * @param data - Recharge data (amount, paymentMethod, paymentId)
   * @returns Promise<any>
   * @deprecated Use initiateRecharge and verifyPayment instead
   */
  async recharge(data: RechargeData): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.WALLET.RECHARGE,
      data
    );
    return response.data!;
  }

  /**
   * Get transaction history
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @param type - Filter by transaction type (optional)
   * @param status - Filter by status (optional)
   * @param startDate - Filter start date (optional)
   * @param endDate - Filter end date (optional)
   * @returns Promise<{ data: Transaction[], pagination: Pagination }>
   */
  async getTransactions(
    page: number = 1,
    limit: number = 20,
    type?: 'recharge' | 'debit' | 'refund',
    status?: 'pending' | 'success' | 'failed' | 'completed',
    startDate?: string,
    endDate?: string
  ): Promise<{ data: Transaction[]; pagination: Pagination }> {
    const params: Record<string, any> = { page, limit };
    if (type) params.type = type;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get<ApiResponse<Transaction[]>>(
      API_ENDPOINTS.WALLET.TRANSACTIONS,
      { params }
    );

    return {
      data: response.data || [],
      pagination: response.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  /**
   * Get recharge history only
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @param status - Filter by status (optional)
   * @returns Promise<{ data: Transaction[], pagination: Pagination }>
   */
  async getRechargeHistory(
    page: number = 1,
    limit: number = 20,
    status?: 'pending' | 'success' | 'failed'
  ): Promise<{ data: Transaction[]; pagination: Pagination }> {
    const params: Record<string, any> = { page, limit };
    if (status) params.status = status;

    const response = await apiClient.get<ApiResponse<Transaction[]>>(
      API_ENDPOINTS.WALLET.RECHARGES,
      { params }
    );

    return {
      data: response.data || [],
      pagination: response.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  /**
   * Get pending orders
   * @returns Promise<PendingOrder[]>
   */
  async getPendingOrders(): Promise<PendingOrder[]> {
    const response = await apiClient.get<ApiResponse<PendingOrder[]>>(
      API_ENDPOINTS.WALLET.PENDING_ORDERS
    );
    return response.data || [];
  }

  /**
   * Cancel a pending order
   * @param orderId - Order ID to cancel
   * @returns Promise<{ success: boolean, message: string }>
   */
  async cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
      API_ENDPOINTS.WALLET.CANCEL_ORDER(orderId)
    );
    return response.data!;
  }
}

export const walletService = new WalletService();
