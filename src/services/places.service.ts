/**
 * Places Service
 * API service for Places Search endpoints
 * Public API - No authentication required
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import { ApiResponse } from '../types/api.types';
import { BirthPlace } from '../types/kundli';

/**
 * Places search response with count
 */
interface PlacesSearchResponse {
  data: BirthPlace[];
  count: number;
}

/**
 * Places API Service
 */
export const placesService = {
  /**
   * Search for cities/locations by name
   * @param query - Search term (min 2 characters)
   * @param limit - Max results (default: 10, max: 50)
   * @returns Promise<BirthPlace[]>
   */
  searchPlaces: async (query: string, limit: number = 10): Promise<BirthPlace[]> => {
    if (query.length < 2) {
      return [];
    }

    const response = await apiClient.getWithParams<ApiResponse<BirthPlace[]> & { count?: number }>(
      API_ENDPOINTS.PLACES.SEARCH,
      { query: encodeURIComponent(query), limit }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to search places');
    }

    return response.data;
  },

  /**
   * Get popular Indian cities for quick selection
   * @param limit - Max results (default: 20)
   * @returns Promise<BirthPlace[]>
   */
  getPopularCities: async (limit: number = 20): Promise<BirthPlace[]> => {
    const response = await apiClient.getWithParams<ApiResponse<BirthPlace[]>>(
      API_ENDPOINTS.PLACES.POPULAR,
      { limit }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch popular cities');
    }

    return response.data;
  },

  /**
   * Reverse geocode - find nearest city from coordinates
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns Promise<BirthPlace>
   */
  reverseGeocode: async (lat: number, lng: number): Promise<BirthPlace> => {
    const response = await apiClient.getWithParams<ApiResponse<BirthPlace>>(
      API_ENDPOINTS.PLACES.REVERSE,
      { lat, lng }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to reverse geocode');
    }

    return response.data;
  },
};
