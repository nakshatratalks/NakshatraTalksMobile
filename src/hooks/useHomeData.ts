/**
 * useHomeData Hook
 * Cache-first pattern for instant navigation
 * Fetches all data needed for HomeScreen
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  userService,
  astrologerService,
  contentService,
  liveSessionService,
  cacheService,
} from '../services';
import {
  UserProfile,
  Astrologer,
  Category,
  Banner,
} from '../types/api.types';
import { LiveSession } from '../types/liveSession.types';
import { handleApiError } from '../utils/errorHandler';
import { QUERY_KEYS } from '../constants/cacheKeys';

interface HomeData {
  userProfile: UserProfile | null;
  liveSessions: LiveSession[];
  topRatedAstrologers: Astrologer[];
  categories: Category[];
  banners: Banner[];
}

interface UseHomeDataReturn extends HomeData {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isFromCache: boolean;
}

export const useHomeData = (): UseHomeDataReturn => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [data, setData] = useState<HomeData>({
    userProfile: null,
    liveSessions: [],
    topRatedAstrologers: [],
    categories: [],
    banners: [],
  });

  /**
   * Check React Query cache for data
   * Returns cached data immediately if available
   */
  const getFromCache = useCallback((): Partial<HomeData> => {
    const cached: Partial<HomeData> = {};

    const userProfile = queryClient.getQueryData<UserProfile>(QUERY_KEYS.USER_PROFILE);
    if (userProfile) cached.userProfile = userProfile;

    const liveSessions = queryClient.getQueryData<LiveSession[]>(QUERY_KEYS.LIVE_SESSIONS);
    if (liveSessions) cached.liveSessions = liveSessions;

    const topRatedAstrologers = queryClient.getQueryData<Astrologer[]>(QUERY_KEYS.TOP_ASTROLOGERS);
    if (topRatedAstrologers) cached.topRatedAstrologers = topRatedAstrologers;

    const categories = queryClient.getQueryData<Category[]>(QUERY_KEYS.CATEGORIES);
    if (categories) cached.categories = categories;

    const banners = queryClient.getQueryData<Banner[]>(QUERY_KEYS.BANNERS);
    if (banners) cached.banners = banners;

    return cached;
  }, [queryClient]);

  /**
   * Load data - cache-first pattern
   * 1. Return cached data immediately if available
   * 2. Fetch fresh data in background
   * 3. Update UI silently when fresh data arrives
   */
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      // Step 1: Check cache first (instant)
      if (!forceRefresh) {
        const cached = getFromCache();
        const hasCachedData = Object.keys(cached).length > 0;

        if (hasCachedData) {
          setData((prev) => ({
            ...prev,
            ...cached,
          }));
          setIsFromCache(true);
          // Don't show loading if we have cached data
        } else {
          setLoading(true);
        }
      } else {
        setLoading(true);
      }

      setError(null);

      // Step 2: Fetch fresh data in background
      const [userProfile, liveSessions, topRatedAstrologers, categories, banners] =
        await Promise.all([
          userService.getProfile().catch(() => null),
          liveSessionService.getLiveSessions(4).catch((err) => {
            console.warn('Failed to load live sessions:', err);
            return [];
          }),
          astrologerService.getTopRatedAstrologers(3).catch((err) => {
            console.warn('Failed to load top rated astrologers:', err);
            return [];
          }),
          contentService.getCategories().catch((err) => {
            console.warn('Failed to load categories:', err);
            return [];
          }),
          contentService.getBanners().catch((err) => {
            console.warn('Failed to load banners:', err);
            return [];
          }),
        ]);

      // Step 3: Update React Query cache
      if (userProfile) {
        queryClient.setQueryData(QUERY_KEYS.USER_PROFILE, userProfile);
        await cacheService.setUserProfile(userProfile);
      }
      if (liveSessions.length > 0) {
        queryClient.setQueryData(QUERY_KEYS.LIVE_SESSIONS, liveSessions);
      }
      if (topRatedAstrologers.length > 0) {
        queryClient.setQueryData(QUERY_KEYS.TOP_ASTROLOGERS, topRatedAstrologers);
        await cacheService.setTopAstrologers(topRatedAstrologers);
      }
      if (categories.length > 0) {
        queryClient.setQueryData(QUERY_KEYS.CATEGORIES, categories);
        await cacheService.setCategories(categories);
      }
      if (banners.length > 0) {
        queryClient.setQueryData(QUERY_KEYS.BANNERS, banners);
      }

      // Step 4: Update state with fresh data
      setData({
        userProfile,
        liveSessions,
        topRatedAstrologers,
        categories,
        banners,
      });
      setIsFromCache(false);
    } catch (err: any) {
      console.error('Error loading home data:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(apiError?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [queryClient, getFromCache]);

  /**
   * Refetch with force refresh
   */
  const refetch = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  /**
   * Initial load - check cache first, then fetch
   */
  useEffect(() => {
    loadData(false);
  }, []);

  return {
    ...data,
    loading,
    error,
    refetch,
    isFromCache,
  };
};
