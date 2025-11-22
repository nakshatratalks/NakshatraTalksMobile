/**
 * useBrowseCallData Hook
 * Fetches available astrologers for call with search and filter functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  userService,
  callService,
  contentService,
} from '../services';
import {
  UserProfile,
  Astrologer,
  Specialization,
  SearchFilters,
} from '../types/api.types';
import { handleApiError } from '../utils/errorHandler';
import { subscribeToCallAvailability } from '../config/supabase.config';

interface BrowseCallData {
  userProfile: UserProfile | null;
  astrologers: Astrologer[];
  specializations: Specialization[];
  selectedSpecialization: string | null;
  searchQuery: string;
}

interface UseBrowseCallDataReturn extends BrowseCallData {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedSpecialization: (specialization: string | null) => void;
}

export const useBrowseCallData = (): UseBrowseCallDataReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQueryState] = useState('');
  const [selectedSpecialization, setSelectedSpecializationState] = useState<string | null>(null);
  const [data, setData] = useState<BrowseCallData>({
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
        callService.getSpecializations().catch(() =>
          contentService.getSpecializations().catch(() => [])
        ),
      ]);

      return { userProfile, specializations };
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      return { userProfile: null, specializations: [] };
    }
  };

  /**
   * Search available astrologers for call with filters
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
        limit: 20,
        offset: 0,
      };

      const response = await callService.getAvailableAstrologers(filters);

      return response.data || [];
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

      // Search available astrologers for call
      const astrologers = await searchAstrologers(searchQuery, selectedSpecialization);

      setData({
        userProfile,
        astrologers,
        specializations,
        selectedSpecialization,
        searchQuery,
      });
    } catch (err: any) {
      console.error('Error loading browse call data:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(apiError?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle real-time astrologer availability updates
   */
  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Call availability changed:', payload);

    if (payload.eventType === 'UPDATE') {
      setData(prev => {
        const exists = prev.astrologers.find(a => a.id === payload.new.id);

        if (exists) {
          // Update existing astrologer
          return {
            ...prev,
            astrologers: prev.astrologers.map(a =>
              a.id === payload.new.id
                ? {
                    ...a,
                    callAvailable: payload.new.call_available,
                    isAvailable: payload.new.call_available,
                    lastActivityAt: payload.new.last_activity_at,
                  }
                : a
            ).filter(a => a.callAvailable !== false), // Remove if went offline
          };
        } else if (payload.new.call_available) {
          // Add new astrologer if they became available
          const newAstrologer: Astrologer = {
            id: payload.new.id,
            name: payload.new.name,
            phone: payload.new.phone,
            email: payload.new.email,
            image: payload.new.image,
            bio: payload.new.bio,
            specialization: payload.new.specialization || [],
            languages: payload.new.languages || [],
            experience: payload.new.experience || 0,
            pricePerMinute: payload.new.call_price_per_minute || 0,
            rating: payload.new.rating || 0,
            totalCalls: payload.new.total_calls || 0,
            totalReviews: payload.new.total_reviews || 0,
            isAvailable: payload.new.call_available,
            isLive: payload.new.is_live || false,
            callAvailable: payload.new.call_available,
            callPricePerMinute: payload.new.call_price_per_minute,
            lastActivityAt: payload.new.last_activity_at,
          };
          return {
            ...prev,
            astrologers: [...prev.astrologers, newAstrologer],
          };
        }

        return prev;
      });
    } else if (payload.eventType === 'INSERT' && payload.new.call_available) {
      // New astrologer became available
      const newAstrologer: Astrologer = {
        id: payload.new.id,
        name: payload.new.name,
        phone: payload.new.phone,
        email: payload.new.email,
        image: payload.new.image,
        bio: payload.new.bio,
        specialization: payload.new.specialization || [],
        languages: payload.new.languages || [],
        experience: payload.new.experience || 0,
        pricePerMinute: payload.new.call_price_per_minute || 0,
        rating: payload.new.rating || 0,
        totalCalls: payload.new.total_calls || 0,
        totalReviews: payload.new.total_reviews || 0,
        isAvailable: payload.new.call_available,
        isLive: payload.new.is_live || false,
        callAvailable: payload.new.call_available,
        callPricePerMinute: payload.new.call_price_per_minute,
        lastActivityAt: payload.new.last_activity_at,
      };

      setData(prev => ({
        ...prev,
        astrologers: [...prev.astrologers, newAstrologer],
      }));
    }
  }, []);

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
        limit: 20,
        offset: 0,
      };

      const response = await callService.getAvailableAstrologers(filters);
      const astrologers = response.data || [];

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
   * Load data on component mount and setup realtime subscription
   */
  useEffect(() => {
    loadData();

    // Setup realtime subscription for call availability
    const unsubscribe = subscribeToCallAvailability(handleRealtimeUpdate);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      unsubscribe();
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
