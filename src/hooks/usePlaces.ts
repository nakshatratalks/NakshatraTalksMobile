/**
 * usePlaces Hook
 * React hook for Places Search API
 */

import { useState, useCallback, useRef } from 'react';
import { placesService } from '../services/places.service';
import { BirthPlace } from '../types/kundli';

interface UsePlacesState {
  results: BirthPlace[];
  popularCities: BirthPlace[];
  loading: boolean;
  error: string | null;
}

interface UsePlacesReturn extends UsePlacesState {
  searchPlaces: (query: string, limit?: number) => Promise<BirthPlace[]>;
  fetchPopularCities: (limit?: number) => Promise<BirthPlace[]>;
  reverseGeocode: (lat: number, lng: number) => Promise<BirthPlace | null>;
  clearResults: () => void;
  clearError: () => void;
}

/**
 * Hook for managing places search
 */
export const usePlaces = (): UsePlacesReturn => {
  const [state, setState] = useState<UsePlacesState>({
    results: [],
    popularCities: [],
    loading: false,
    error: null,
  });

  // Debounce reference for search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Search for places/cities by name
   * @param query - Search query (min 2 characters)
   * @param limit - Max results (default: 10)
   */
  const searchPlaces = useCallback(async (
    query: string,
    limit: number = 10
  ): Promise<BirthPlace[]> => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Skip empty or too short queries
    if (query.trim().length < 2) {
      setState((prev) => ({ ...prev, results: [], error: null }));
      return [];
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await placesService.searchPlaces(query, limit);
      setState((prev) => ({ ...prev, results: data, loading: false }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to search places';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return [];
    }
  }, []);

  /**
   * Fetch popular Indian cities
   * @param limit - Max results (default: 20)
   */
  const fetchPopularCities = useCallback(async (limit: number = 20): Promise<BirthPlace[]> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await placesService.getPopularCities(limit);
      setState((prev) => ({ ...prev, popularCities: data, loading: false }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch popular cities';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return [];
    }
  }, []);

  /**
   * Reverse geocode - find nearest city from coordinates
   * @param lat - Latitude
   * @param lng - Longitude
   */
  const reverseGeocode = useCallback(async (
    lat: number,
    lng: number
  ): Promise<BirthPlace | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await placesService.reverseGeocode(lat, lng);
      setState((prev) => ({ ...prev, loading: false }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reverse geocode';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    setState((prev) => ({ ...prev, results: [] }));
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    searchPlaces,
    fetchPopularCities,
    reverseGeocode,
    clearResults,
    clearError,
  };
};

/**
 * Hook for debounced place search
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 */
export const useDebouncedPlaceSearch = (debounceMs: number = 300) => {
  const [query, setQuery] = useState('');
  const { results, loading, error, searchPlaces, clearResults, clearError } = usePlaces();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Skip empty queries
    if (searchQuery.trim().length < 2) {
      clearResults();
      return;
    }

    // Debounce the search
    timeoutRef.current = setTimeout(() => {
      searchPlaces(searchQuery);
    }, debounceMs);
  }, [searchPlaces, clearResults, debounceMs]);

  return {
    query,
    results,
    loading,
    error,
    search,
    clearResults,
    clearError,
  };
};
