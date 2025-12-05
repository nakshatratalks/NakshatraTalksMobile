/**
 * useKundliApi Hook
 * React hook for Kundli API (server-side operations)
 * Use useKundliStorage for local storage operations
 */

import { useState, useCallback } from 'react';
import { kundliService } from '../services/kundli.service';
import { Pagination } from '../types/api.types';
import {
  SavedKundli,
  KundliInput,
  KundliReport,
  KundliListParams,
} from '../types/kundli';

interface UseKundliApiState {
  kundlis: SavedKundli[];
  currentKundli: SavedKundli | null;
  report: KundliReport | null;
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
}

interface UseKundliApiReturn extends UseKundliApiState {
  generateKundli: (input: KundliInput) => Promise<SavedKundli | null>;
  fetchKundliList: (params?: KundliListParams) => Promise<void>;
  fetchKundli: (kundliId: string) => Promise<SavedKundli | null>;
  fetchReport: (kundliId: string) => Promise<KundliReport | null>;
  updateKundli: (kundliId: string, input: Partial<KundliInput>) => Promise<SavedKundli | null>;
  deleteKundli: (kundliId: string) => Promise<boolean>;
  clearError: () => void;
  clearReport: () => void;
}

/**
 * Hook for managing Kundli API operations
 */
export const useKundliApi = (): UseKundliApiReturn => {
  const [state, setState] = useState<UseKundliApiState>({
    kundlis: [],
    currentKundli: null,
    report: null,
    pagination: null,
    loading: false,
    error: null,
  });

  /**
   * Generate a new kundli
   */
  const generateKundli = useCallback(async (input: KundliInput): Promise<SavedKundli | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await kundliService.generate(input);
      setState((prev) => ({
        ...prev,
        currentKundli: data,
        kundlis: [data, ...prev.kundlis],
        loading: false,
      }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate kundli';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  /**
   * Fetch paginated list of kundlis
   */
  const fetchKundliList = useCallback(async (params: KundliListParams = {}): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, pagination } = await kundliService.list(params);
      setState((prev) => ({
        ...prev,
        kundlis: data,
        pagination,
        loading: false,
      }));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch kundli list';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, []);

  /**
   * Fetch a single kundli by ID
   */
  const fetchKundli = useCallback(async (kundliId: string): Promise<SavedKundli | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await kundliService.getById(kundliId);
      setState((prev) => ({ ...prev, currentKundli: data, loading: false }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch kundli';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  /**
   * Fetch full kundli report
   */
  const fetchReport = useCallback(async (kundliId: string): Promise<KundliReport | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await kundliService.getReport(kundliId);
      setState((prev) => ({ ...prev, report: data, loading: false }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch kundli report';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  /**
   * Update an existing kundli
   */
  const updateKundli = useCallback(async (
    kundliId: string,
    input: Partial<KundliInput>
  ): Promise<SavedKundli | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await kundliService.update(kundliId, input);
      setState((prev) => ({
        ...prev,
        currentKundli: data,
        kundlis: prev.kundlis.map((k) => (k.id === kundliId ? data : k)),
        report: null, // Clear report as it may be invalidated
        loading: false,
      }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update kundli';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  /**
   * Delete a kundli
   */
  const deleteKundli = useCallback(async (kundliId: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await kundliService.delete(kundliId);
      setState((prev) => ({
        ...prev,
        kundlis: prev.kundlis.filter((k) => k.id !== kundliId),
        currentKundli: prev.currentKundli?.id === kundliId ? null : prev.currentKundli,
        report: prev.report?.kundliId === kundliId ? null : prev.report,
        loading: false,
      }));
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete kundli';
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
    generateKundli,
    fetchKundliList,
    fetchKundli,
    fetchReport,
    updateKundli,
    deleteKundli,
    clearError,
    clearReport,
  };
};

/**
 * Hook for fetching a specific kundli and its report
 * @param kundliId - Kundli ID to fetch
 * @param autoFetch - Whether to auto-fetch on mount (default: true)
 */
export const useKundliReport = (kundliId: string | null, autoFetch: boolean = true) => {
  const {
    currentKundli,
    report,
    loading,
    error,
    fetchKundli,
    fetchReport,
    clearError,
    clearReport,
  } = useKundliApi();

  // Auto-fetch on mount if kundliId is provided
  const loadKundliAndReport = useCallback(async () => {
    if (!kundliId) return;

    await fetchKundli(kundliId);
    await fetchReport(kundliId);
  }, [kundliId, fetchKundli, fetchReport]);

  // Effect for auto-fetch (must be called by the component)
  const initFetch = useCallback(() => {
    if (autoFetch && kundliId) {
      loadKundliAndReport();
    }
  }, [autoFetch, kundliId, loadKundliAndReport]);

  return {
    kundli: currentKundli,
    report,
    loading,
    error,
    refetch: loadKundliAndReport,
    initFetch,
    clearError,
    clearReport,
  };
};
