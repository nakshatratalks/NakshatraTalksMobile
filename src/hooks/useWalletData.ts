/**
 * useWalletData Hook
 * Fetches and manages wallet data including balance, summary, and transactions
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../services/wallet.service';
import {
  WalletSummary,
  Transaction,
  Pagination,
  RechargeOption,
} from '../types/api.types';
import { QUERY_KEYS } from '../constants/cacheKeys';
import { RAZORPAY_CONFIG } from '../config/razorpay.config';

// Transaction filter type
export type TransactionFilter = 'all' | 'recharge' | 'debit';

interface UseWalletDataReturn {
  // Wallet Summary
  walletSummary: WalletSummary | null;
  balance: number;
  pendingOrders: number;

  // Transactions
  transactions: Transaction[];
  transactionsPagination: Pagination | null;
  activeFilter: TransactionFilter;
  setActiveFilter: (filter: TransactionFilter) => void;

  // Recharge Options
  rechargeOptions: RechargeOption[];

  // Loading States
  isLoading: boolean;
  isSummaryLoading: boolean;
  isTransactionsLoading: boolean;
  isLoadingMore: boolean;

  // Error States
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

export const useWalletData = (): UseWalletDataReturn => {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('all');
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch wallet summary
  const {
    data: walletSummary,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: [QUERY_KEYS.WALLET_BALANCE, 'summary'],
    queryFn: async () => {
      try {
        return await walletService.getSummary();
      } catch (error) {
        // Fallback to balance endpoint if summary not available
        const balance = await walletService.getBalance();
        return {
          balance: balance.balance,
          currency: balance.currency,
          pendingOrders: 0,
          stats: {
            last30Days: {
              totalSpent: 0,
              totalRecharged: 0,
              transactionCount: 0,
            },
          },
          recentTransactions: [],
        } as WalletSummary;
      }
    },
    staleTime: 30 * 1000, // 30 seconds - wallet balance should refresh frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch transactions based on filter
  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: [QUERY_KEYS.WALLET_TRANSACTIONS, activeFilter, transactionsPage],
    queryFn: async () => {
      const type = activeFilter === 'all' ? undefined : activeFilter;
      return await walletService.getTransactions(transactionsPage, 20, type);
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch recharge options
  const { data: rechargeOptions = RAZORPAY_CONFIG.DEFAULT_RECHARGE_OPTIONS } = useQuery({
    queryKey: ['rechargeOptions'],
    queryFn: async () => {
      try {
        const options = await walletService.getRechargeOptions();
        return options.length > 0 ? options : RAZORPAY_CONFIG.DEFAULT_RECHARGE_OPTIONS;
      } catch {
        return RAZORPAY_CONFIG.DEFAULT_RECHARGE_OPTIONS;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Update transactions list when data changes
  useEffect(() => {
    if (transactionsData?.data) {
      if (transactionsPage === 1) {
        setAllTransactions(transactionsData.data);
      } else {
        setAllTransactions(prev => [...prev, ...transactionsData.data]);
      }
    }
  }, [transactionsData, transactionsPage]);

  // Reset page when filter changes
  useEffect(() => {
    setTransactionsPage(1);
    setAllTransactions([]);
  }, [activeFilter]);

  // Load more transactions
  const loadMoreTransactions = useCallback(async () => {
    if (
      isLoadingMore ||
      !transactionsData?.pagination?.hasNext ||
      isTransactionsLoading
    ) {
      return;
    }

    setIsLoadingMore(true);
    setTransactionsPage(prev => prev + 1);
    setIsLoadingMore(false);
  }, [isLoadingMore, transactionsData?.pagination?.hasNext, isTransactionsLoading]);

  // Refresh all data
  const refetch = useCallback(async () => {
    setTransactionsPage(1);
    setAllTransactions([]);
    await Promise.all([
      refetchSummary(),
      refetchTransactions(),
    ]);
  }, [refetchSummary, refetchTransactions]);

  // Refresh just the balance
  const refreshBalance = useCallback(async () => {
    await refetchSummary();
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
  }, [refetchSummary, queryClient]);

  // Handle filter change
  const handleFilterChange = useCallback((filter: TransactionFilter) => {
    if (filter !== activeFilter) {
      setActiveFilter(filter);
    }
  }, [activeFilter]);

  // Compute error message
  const error = summaryError
    ? 'Failed to load wallet data'
    : transactionsError
    ? 'Failed to load transactions'
    : null;

  return {
    // Wallet Summary
    walletSummary: walletSummary || null,
    balance: walletSummary?.balance || 0,
    pendingOrders: walletSummary?.pendingOrders || 0,

    // Transactions
    transactions: allTransactions,
    transactionsPagination: transactionsData?.pagination || null,
    activeFilter,
    setActiveFilter: handleFilterChange,

    // Recharge Options
    rechargeOptions,

    // Loading States
    isLoading: isSummaryLoading || isTransactionsLoading,
    isSummaryLoading,
    isTransactionsLoading,
    isLoadingMore,

    // Error States
    error,

    // Actions
    refetch,
    loadMoreTransactions,
    refreshBalance,
  };
};
