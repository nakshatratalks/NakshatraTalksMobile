/**
 * useAstrologerDetails Hook
 * Fetches detailed information about a specific astrologer
 */

import { useState, useEffect } from 'react';
import { astrologerService } from '../services';
import { Astrologer } from '../types/api.types';
import { handleApiError } from '../utils/errorHandler';

interface UseAstrologerDetailsReturn {
  astrologer: Astrologer | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAstrologerDetails = (
  astrologerId: string
): UseAstrologerDetailsReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [astrologer, setAstrologer] = useState<Astrologer | null>(null);

  /**
   * Load astrologer details from API
   */
  const loadDetails = async () => {
    if (!astrologerId) {
      setError('Astrologer ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await astrologerService.getAstrologerDetails(astrologerId);
      setAstrologer(data);
    } catch (err: any) {
      console.error('Error loading astrologer details:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(
        apiError?.message || 'Failed to load astrologer details'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load data on component mount or when astrologerId changes
   */
  useEffect(() => {
    loadDetails();
  }, [astrologerId]);

  return {
    astrologer,
    loading,
    error,
    refetch: loadDetails,
  };
};
