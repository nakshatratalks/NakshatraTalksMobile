/**
 * Wallet Service
 * Handles wallet and transaction operations
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import { WalletBalance, Transaction, RechargeData, ApiResponse, Pagination } from '../types/api.types';

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
   * Recharge wallet
   * @param data - Recharge data (amount, paymentMethod, paymentId)
   * @returns Promise<any>
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
   * @param startDate - Filter start date (optional)
   * @param endDate - Filter end date (optional)
   * @returns Promise<{ data: Transaction[], pagination: Pagination }>
   */
  async getTransactions(
    page: number = 1,
    limit: number = 20,
    type?: 'recharge' | 'debit' | 'refund',
    startDate?: string,
    endDate?: string
  ): Promise<{ data: Transaction[]; pagination: Pagination }> {
    const params: any = { page, limit };
    if (type) params.type = type;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get<ApiResponse<Transaction[]>>(
      API_ENDPOINTS.WALLET.TRANSACTIONS,
      { params }
    );

    return {
      data: response.data!,
      pagination: response.pagination!,
    };
  }
}

export const walletService = new WalletService();
