/**
 * User Service
 * Handles user profile operations
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import { UserProfile, UpdateProfileData, ApiResponse } from '../types/api.types';

class UserService {
  /**
   * Get user profile
   * @returns Promise<UserProfile>
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>(
      API_ENDPOINTS.USER.PROFILE
    );
    return response.data!;
  }

  /**
   * Update user profile
   * @param data - Profile data to update
   * @returns Promise<UserProfile>
   */
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await apiClient.put<ApiResponse<UserProfile>>(
      API_ENDPOINTS.USER.PROFILE,
      data
    );
    return response.data!;
  }
}

export const userService = new UserService();
