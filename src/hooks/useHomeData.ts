/**
 * useHomeData Hook
 * Fetches all data needed for HomeScreen
 */

import { useState, useEffect } from 'react';
import {
  userService,
  astrologerService,
  contentService,
  liveSessionService,
} from '../services';
import {
  UserProfile,
  Astrologer,
  Category,
  Banner,
} from '../types/api.types';
import { LiveSession } from '../types/liveSession.types';
import { handleApiError } from '../utils/errorHandler';

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
}

export const useHomeData = (): UseHomeDataReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HomeData>({
    userProfile: null,
    liveSessions: [],
    topRatedAstrologers: [],
    categories: [],
    banners: [],
  });

  /**
   * Load all home screen data
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel for performance
      const [userProfile, liveSessions, topRatedAstrologers, categories, banners] =
        await Promise.all([
          userService.getProfile().catch(() => null), // User profile optional if not logged in
          liveSessionService.getLiveSessions(4),
          astrologerService.getTopRatedAstrologers(3),
          contentService.getCategories(),
          contentService.getBanners(),
        ]);

      setData({
        userProfile,
        liveSessions,
        topRatedAstrologers,
        categories,
        banners,
      });
    } catch (err: any) {
      console.error('Error loading home data:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(apiError?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load data on component mount
   */
  useEffect(() => {
    loadData();
  }, []);

  return {
    ...data,
    loading,
    error,
    refetch: loadData,
  };
};
