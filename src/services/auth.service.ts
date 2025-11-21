/**
 * Authentication Service
 * Handles OTP authentication flow
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import { SendOtpResponse, VerifyOtpResponse, GetMeResponse } from '../types/api.types';

class AuthService {
  /**
   * Send OTP to phone number
   * @param phone - Phone number in E.164 format (e.g., +919876543210)
   * @returns Promise<SendOtpResponse>
   */
  async sendOtp(phone: string): Promise<SendOtpResponse> {
    return apiClient.post<SendOtpResponse>(API_ENDPOINTS.AUTH.SEND_OTP, { phone });
  }

  /**
   * Verify OTP and get authentication token
   * @param phone - Phone number in E.164 format
   * @param otp - 6-digit OTP
   * @returns Promise<VerifyOtpResponse>
   */
  async verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
    const response = await apiClient.post<VerifyOtpResponse>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      { phone, otp }
    );

    // Save token after successful verification
    if (response.success && response.access_token) {
      await apiClient.setAuthToken(response.access_token);
    }

    return response;
  }

  /**
   * Get current authenticated user
   * @returns Promise<GetMeResponse>
   */
  async getCurrentUser(): Promise<GetMeResponse> {
    return apiClient.get<GetMeResponse>(API_ENDPOINTS.AUTH.ME);
  }

  /**
   * Logout user (clear tokens)
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    await apiClient.clearAuthToken();
  }

  /**
   * Check if user is authenticated
   * @returns Promise<boolean>
   */
  async isAuthenticated(): Promise<boolean> {
    return apiClient.isAuthenticated();
  }

  /**
   * Get current auth token
   * @returns Promise<string | null>
   */
  async getAuthToken(): Promise<string | null> {
    return apiClient.getAuthToken();
  }
}

export const authService = new AuthService();
