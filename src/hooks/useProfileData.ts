/**
 * useProfileData Hook
 * Fetches user profile data
 */

import { useState, useEffect } from 'react';
import { userService } from '../services';
import { UserProfile } from '../types/api.types';
import { handleApiError } from '../utils/errorHandler';

interface UseProfileDataReturn {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updating: boolean;
}

export const useProfileData = (): UseProfileDataReturn => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  /**
   * Load user profile data
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const profile = await userService.getProfile();
      setUserProfile(profile);
    } catch (err: any) {
      console.error('Error loading profile data:', err);
      const apiError = handleApiError(err, { showAlert: false });
      setError(apiError?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (data: any) => {
    try {
      setUpdating(true);
      setError(null);

      const updatedProfile = await userService.updateProfile(data);
      setUserProfile(updatedProfile);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      handleApiError(err);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Load data on component mount
   */
  useEffect(() => {
    loadData();
  }, []);

  return {
    userProfile,
    loading,
    error,
    refetch: loadData,
    updateProfile,
    updating,
  };
};
