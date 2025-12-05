/**
 * useMatchingApi Hook
 * React hook for Kundli Matching API (server-side operations)
 * Use useSavedMatchings from useKundliStorage for local storage operations
 */

import { useState, useCallback } from 'react';
import { matchingService } from '../services/matching.service';
import { Pagination } from '../types/api.types';
import {
  SavedMatching,
  MatchingInput,
  MatchingReport,
  MatchingListParams,
} from '../types/kundli';

interface UseMatchingApiState {
  matchings: SavedMatching[];
  currentMatching: SavedMatching | null;
  report: MatchingReport | null;
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
}

interface UseMatchingApiReturn extends UseMatchingApiState {
  generateMatching: (input: MatchingInput) => Promise<SavedMatching | null>;
  fetchMatchingList: (params?: MatchingListParams) => Promise<void>;
  fetchMatching: (matchingId: string) => Promise<SavedMatching | null>;
  fetchReport: (matchingId: string) => Promise<MatchingReport | null>;
  deleteMatching: (matchingId: string) => Promise<boolean>;
  clearError: () => void;
  clearReport: () => void;
}

/**
 * Hook for managing Kundli Matching API operations
 */
export const useMatchingApi = (): UseMatchingApiReturn => {
  const [state, setState] = useState<UseMatchingApiState>({
    matchings: [],
    currentMatching: null,
    report: null,
    pagination: null,
    loading: false,
    error: null,
  });

  /**
   * Generate a new matching report
   */
  const generateMatching = useCallback(async (input: MatchingInput): Promise<SavedMatching | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await matchingService.generate(input);
      setState((prev) => ({
        ...prev,
        currentMatching: data,
        matchings: [data, ...prev.matchings],
        loading: false,
      }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate matching report';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  /**
   * Fetch paginated list of matchings
   */
  const fetchMatchingList = useCallback(async (params: MatchingListParams = {}): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, pagination } = await matchingService.list(params);
      setState((prev) => ({
        ...prev,
        matchings: data,
        pagination,
        loading: false,
      }));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch matching list';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, []);

  /**
   * Fetch a single matching by ID
   */
  const fetchMatching = useCallback(async (matchingId: string): Promise<SavedMatching | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await matchingService.getById(matchingId);
      setState((prev) => ({ ...prev, currentMatching: data, loading: false }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch matching';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  /**
   * Fetch full matching report (Ashtakoot analysis)
   */
  const fetchReport = useCallback(async (matchingId: string): Promise<MatchingReport | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await matchingService.getReport(matchingId);
      setState((prev) => ({ ...prev, report: data, loading: false }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch matching report';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  /**
   * Delete a matching report
   */
  const deleteMatching = useCallback(async (matchingId: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await matchingService.delete(matchingId);
      setState((prev) => ({
        ...prev,
        matchings: prev.matchings.filter((m) => m.id !== matchingId),
        currentMatching: prev.currentMatching?.id === matchingId ? null : prev.currentMatching,
        report: prev.report?.matchingId === matchingId ? null : prev.report,
        loading: false,
      }));
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete matching';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return false;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Clear report state
   */
  const clearReport = useCallback(() => {
    setState((prev) => ({ ...prev, report: null }));
  }, []);

  return {
    ...state,
    generateMatching,
    fetchMatchingList,
    fetchMatching,
    fetchReport,
    deleteMatching,
    clearError,
    clearReport,
  };
};

/**
 * Hook for fetching a specific matching and its report
 * @param matchingId - Matching ID to fetch
 * @param autoFetch - Whether to auto-fetch on mount (default: true)
 */
export const useMatchingReport = (matchingId: string | null, autoFetch: boolean = true) => {
  const {
    currentMatching,
    report,
    loading,
    error,
    fetchMatching,
    fetchReport,
    clearError,
    clearReport,
  } = useMatchingApi();

  // Load matching and report
  const loadMatchingAndReport = useCallback(async () => {
    if (!matchingId) return;

    await fetchMatching(matchingId);
    await fetchReport(matchingId);
  }, [matchingId, fetchMatching, fetchReport]);

  // Effect for auto-fetch (must be called by the component)
  const initFetch = useCallback(() => {
    if (autoFetch && matchingId) {
      loadMatchingAndReport();
    }
  }, [autoFetch, matchingId, loadMatchingAndReport]);

  return {
    matching: currentMatching,
    report,
    loading,
    error,
    refetch: loadMatchingAndReport,
    initFetch,
    clearError,
    clearReport,
  };
};

/**
 * Helper to calculate compatibility rating text
 */
export const getCompatibilityRating = (score: number, maxScore: number = 36): {
  rating: 'excellent' | 'good' | 'average' | 'below_average';
  percentage: number;
  description: string;
} => {
  const percentage = Math.round((score / maxScore) * 100);

  if (percentage >= 75) {
    return {
      rating: 'excellent',
      percentage,
      description: 'Excellent match! Highly recommended.',
    };
  } else if (percentage >= 60) {
    return {
      rating: 'good',
      percentage,
      description: 'Good match with minor considerations.',
    };
  } else if (percentage >= 45) {
    return {
      rating: 'average',
      percentage,
      description: 'Average compatibility. Consider remedies.',
    };
  } else {
    return {
      rating: 'below_average',
      percentage,
      description: 'Below average. Consult an astrologer.',
    };
  }
};
