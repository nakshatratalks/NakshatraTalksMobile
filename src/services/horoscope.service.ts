/**
 * Horoscope Service
 * API service for Daily Horoscope endpoints
 * Public API - No authentication required
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import { ApiResponse } from '../types/api.types';
import { DailyHoroscope, ZodiacSign, ZodiacSignId } from '../types/horoscope';

/**
 * Horoscope API Service
 */
export const horoscopeService = {
  /**
   * Get daily horoscope for a zodiac sign
   * @param sign - Zodiac sign ID (lowercase)
   * @returns Promise<DailyHoroscope>
   */
  getDailyHoroscope: async (sign: ZodiacSignId): Promise<DailyHoroscope> => {
    const response = await apiClient.getWithParams<ApiResponse<DailyHoroscope>>(
      API_ENDPOINTS.HOROSCOPE.DAILY,
      { sign }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch horoscope');
    }

    return response.data;
  },

  /**
   * Get all zodiac signs with their details
   * @returns Promise<ZodiacSign[]>
   */
  getZodiacSigns: async (): Promise<ZodiacSign[]> => {
    const response = await apiClient.get<ApiResponse<ZodiacSign[]>>(
      API_ENDPOINTS.HOROSCOPE.SIGNS
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch zodiac signs');
    }

    return response.data;
  },
};
