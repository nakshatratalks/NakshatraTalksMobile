/**
 * App Data Context
 * Manages global prefetch state and provides access to cached data
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchService, PrefetchResult } from '../services/prefetch.service';
import { useAuth } from './AuthContext';

interface AppDataContextType {
  // Prefetch state
  isPrefetching: boolean;
  prefetchComplete: boolean;
  prefetchError: string | null;
  prefetchResult: PrefetchResult | null;

  // Actions
  refreshAllData: () => Promise<void>;
  refreshScreenData: (screen: 'home' | 'browseChat' | 'browseCall' | 'liveSession' | 'profile') => Promise<void>;
  clearCache: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

interface AppDataProviderProps {
  children: ReactNode;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchComplete, setPrefetchComplete] = useState(false);
  const [prefetchError, setPrefetchError] = useState<string | null>(null);
  const [prefetchResult, setPrefetchResult] = useState<PrefetchResult | null>(null);

  // Initialize prefetch service with query client
  useEffect(() => {
    prefetchService.setQueryClient(queryClient);
  }, [queryClient]);

  // Hydrate from cache immediately on mount
  useEffect(() => {
    const hydrateCache = async () => {
      try {
        await prefetchService.hydrateFromCache();
      } catch (error) {
        console.warn('[AppData] Cache hydration failed:', error);
      }
    };

    hydrateCache();
  }, []);

  // Start prefetch after authentication is confirmed
  useEffect(() => {
    const startPrefetch = async () => {
      if (authLoading || !isAuthenticated) {
        return;
      }

      // Don't prefetch again if already complete
      if (prefetchComplete) {
        return;
      }

      setIsPrefetching(true);
      setPrefetchError(null);

      try {
        const result = await prefetchService.prefetchAllData();
        setPrefetchResult(result);
        setPrefetchComplete(true);

        if (!result.success && result.failed.length > 0) {
          console.warn('[AppData] Some prefetch tasks failed:', result.failed);
        }
      } catch (error) {
        console.error('[AppData] Prefetch error:', error);
        setPrefetchError(error instanceof Error ? error.message : 'Prefetch failed');
      } finally {
        setIsPrefetching(false);
      }
    };

    startPrefetch();
  }, [isAuthenticated, authLoading, prefetchComplete]);

  // Refresh all data (called on manual refresh)
  const refreshAllData = useCallback(async () => {
    setIsPrefetching(true);
    setPrefetchError(null);

    try {
      const result = await prefetchService.prefetchAllData();
      setPrefetchResult(result);
    } catch (error) {
      console.error('[AppData] Refresh error:', error);
      setPrefetchError(error instanceof Error ? error.message : 'Refresh failed');
    } finally {
      setIsPrefetching(false);
    }
  }, []);

  // Refresh specific screen data
  const refreshScreenData = useCallback(
    async (screen: 'home' | 'browseChat' | 'browseCall' | 'liveSession' | 'profile') => {
      try {
        await prefetchService.refreshScreenData(screen);
      } catch (error) {
        console.error(`[AppData] Failed to refresh ${screen}:`, error);
      }
    },
    []
  );

  // Clear all cache
  const clearCache = useCallback(async () => {
    try {
      await prefetchService.clearCache();
      setPrefetchComplete(false);
      setPrefetchResult(null);
    } catch (error) {
      console.error('[AppData] Failed to clear cache:', error);
    }
  }, []);

  const value: AppDataContextType = {
    isPrefetching,
    prefetchComplete,
    prefetchError,
    prefetchResult,
    refreshAllData,
    refreshScreenData,
    clearCache,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

// Custom hook to use app data context
export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
