/**
 * useBrowseChatData Hook
 * Fetches astrologers list with search and filter functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  userService,
  astrologerService,
  contentService,
} from '../services';
import {
  UserProfile,
  Astrologer,
  Specialization,
  SearchFilters,
} from '../types/api.types';
import { handleApiError } from '../utils/errorHandler';

interface BrowseChatData {
  userProfile: UserProfile | null;
  astrologers: Astrologer[];
  specializations: Specialization[];
  selectedSpecialization: string | null;
  searchQuery: string;
}

interface UseBrowseChatDataReturn extends BrowseChatData {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedSpecialization: (specialization: string | null) => void;
}

export const useBrowseChatData = (): UseBrowseChatDataReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQueryState] = useState('');
  const [selectedSpecialization, setSelectedSpecializationState] = useState<string | null>(null);
  const [data, setData] = useState<BrowseChatData>({
    userProfile: null,
    astrologers: [],
    specializations: [],
    selectedSpecialization: null,
    searchQuery: '',
  });

  // Debounce timer ref
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Load initial data (user profile and specializations)
   */
  const loadInitialData = async () => {
    try {
      const [userProfile, specializations] = await Promise.all([
        userService.getProfile().catch(() => null),
        contentService.getSpecializations().catch(() => []),
      ]);

      return { userProfile, specializations };
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      return { userProfile: null, specializations: [] };
    }
  };

  /**
   * Search astrologers with filters
   */
  const searchAstrologers = async (
    query: string = '',
    specialization: string | null = null
  ) => {
    try {
      setLoading(true);
      setError(null);

      const filters: SearchFilters = {
        q: query || undefined,
        specialization: specialization || undefined,
        sortBy: 'rating',
        order: 'desc',
      };

      const results = await astrologerService.searchAstrologers(filters);

      return results.results || [];
    } catch (err: any) {
      console.error('Error searching astrologers:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(apiError?.message || 'Failed to search astrologers');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load all data (initial + search)
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load initial data
      const { userProfile, specializations } = await loadInitialData();

      // Search astrologers
      const astrologers = await searchAstrologers(searchQuery, selectedSpecialization);

      setData({
        userProfile,
        astrologers,
        specializations,
        selectedSpecialization,
        searchQuery,
      });
    } catch (err: any) {
      console.error('Error loading browse chat data:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(apiError?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle search query change with debouncing
   */
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer (500ms debounce)
    debounceTimer.current = setTimeout(async () => {
      const astrologers = await searchAstrologers(query, selectedSpecialization);
      setData(prev => ({ ...prev, astrologers, searchQuery: query }));
    }, 500);
  }, [selectedSpecialization]);

  /**
   * Handle specialization filter change
   */
  const setSelectedSpecialization = useCallback(async (specialization: string | null) => {
    // Update state immediately for instant UI feedback
    setSelectedSpecializationState(specialization);
    setData(prev => ({
      ...prev,
      selectedSpecialization: specialization
    }));

    // Then fetch data in background
    try {
      setError(null);
      const filters: SearchFilters = {
        q: searchQuery || undefined,
        specialization: specialization || undefined,
        sortBy: 'rating',
        order: 'desc',
      };

      const results = await astrologerService.searchAstrologers(filters);
      const astrologers = results.results || [];

      setData(prev => ({
        ...prev,
        astrologers
      }));
    } catch (err: any) {
      console.error('Error searching astrologers:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(apiError?.message || 'Failed to search astrologers');
    }
  }, [searchQuery]);

  /**
   * Load data on component mount
   */
  useEffect(() => {
    loadData();

    // Cleanup debounce timer on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    ...data,
    loading,
    error,
    refetch: loadData,
    setSearchQuery,
    setSelectedSpecialization,
  };
};
