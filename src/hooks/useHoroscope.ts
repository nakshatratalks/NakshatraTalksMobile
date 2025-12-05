/**
 * useHoroscope Hook
 * React hook for Daily Horoscope API
 */

import { useState, useCallback, useEffect } from 'react';
import { horoscopeService } from '../services/horoscope.service';
import { DailyHoroscope, ZodiacSign, ZodiacSignId } from '../types/horoscope';

interface UseHoroscopeState {
  horoscope: DailyHoroscope | null;
  zodiacSigns: ZodiacSign[];
  loading: boolean;
  error: string | null;
}

interface UseHoroscopeReturn extends UseHoroscopeState {
  fetchHoroscope: (sign: ZodiacSignId) => Promise<DailyHoroscope | null>;
  fetchZodiacSigns: () => Promise<ZodiacSign[]>;
  clearError: () => void;
}

/**
 * Hook for managing daily horoscope data
 */
export const useHoroscope = (): UseHoroscopeReturn => {
  const [state, setState] = useState<UseHoroscopeState>({
    horoscope: null,
    zodiacSigns: [],
    loading: false,
    error: null,
  });

  /**
   * Fetch daily horoscope for a specific zodiac sign
   */
  const fetchHoroscope = useCallback(async (sign: ZodiacSignId): Promise<DailyHoroscope | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await horoscopeService.getDailyHoroscope(sign);
      setState((prev) => ({ ...prev, horoscope: data, loading: false }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch horoscope';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  /**
   * Fetch all zodiac signs
   */
  const fetchZodiacSigns = useCallback(async (): Promise<ZodiacSign[]> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await horoscopeService.getZodiacSigns();
      setState((prev) => ({ ...prev, zodiacSigns: data, loading: false }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch zodiac signs';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return [];
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    fetchHoroscope,
    fetchZodiacSigns,
    clearError,
  };
};

/**
 * Hook for fetching horoscope for a specific sign on mount
 * @param sign - Zodiac sign to fetch
 * @param autoFetch - Whether to auto-fetch on mount (default: true)
 */
export const useDailyHoroscope = (
  sign: ZodiacSignId | null,
  autoFetch: boolean = true
) => {
  const { horoscope, loading, error, fetchHoroscope, clearError } = useHoroscope();

  useEffect(() => {
    if (autoFetch && sign) {
      fetchHoroscope(sign);
    }
  }, [sign, autoFetch, fetchHoroscope]);

  return {
    horoscope,
    loading,
    error,
    refetch: () => sign && fetchHoroscope(sign),
    clearError,
  };
};
