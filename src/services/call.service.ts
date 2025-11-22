/**
 * Call Service
 * Handles call-related API calls
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import {
  Astrologer,
  SearchFilters,
  ApiResponse,
  Pagination,
  Specialization,
  BalanceValidationResponse,
  CreateSessionData,
  ChatSession,
  EndSessionData,
} from '../types/api.types';

interface AvailableCallAstrologersResponse {
  data: Astrologer[];
  pagination: Pagination;
}

class CallService {
  /**
   * Get available astrologers for calls
   * @param filters - Search filters
   * @returns Promise<AvailableCallAstrologersResponse>
   */
  async getAvailableAstrologers(
    filters?: SearchFilters
  ): Promise<AvailableCallAstrologersResponse> {
    const response = await apiClient.get<ApiResponse<Astrologer[]>>(
      API_ENDPOINTS.CALL.AVAILABLE_ASTROLOGERS,
      { params: filters }
    );

    return {
      data: response.data || [],
      pagination: response.pagination!,
    };
  }

  /**
   * Get all specializations for call
   * @returns Promise<Specialization[]>
   */
  async getSpecializations(): Promise<Specialization[]> {
    const response = await apiClient.get<ApiResponse<Specialization[]>>(
      API_ENDPOINTS.CALL.SPECIALIZATIONS
    );
    return response.data || [];
  }

  /**
   * Validate user balance before starting call
   * @param astrologerId - Astrologer ID
   * @returns Promise<BalanceValidationResponse>
   */
  async validateBalance(astrologerId: string): Promise<BalanceValidationResponse> {
    const response = await apiClient.post<ApiResponse<BalanceValidationResponse>>(
      API_ENDPOINTS.CALL.VALIDATE_BALANCE,
      { astrologerId }
    );
    return response.data!;
  }

  /**
   * Start a new call session
   * @param data - Session creation data
   * @returns Promise<ChatSession>
   */
  async startSession(data: CreateSessionData): Promise<ChatSession> {
    const response = await apiClient.post<ApiResponse<ChatSession>>(
      API_ENDPOINTS.CALL.SESSIONS,
      data
    );
    return response.data!;
  }

  /**
   * Get active call session
   * @returns Promise<ChatSession | null>
   */
  async getActiveSession(): Promise<ChatSession | null> {
    const response = await apiClient.get<ApiResponse<ChatSession>>(
      API_ENDPOINTS.CALL.ACTIVE_SESSION
    );
    return response.data || null;
  }

  /**
   * End a call session
   * @param sessionId - Session ID
   * @param data - End session data
   * @returns Promise<any>
   */
  async endSession(sessionId: string, data?: EndSessionData): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.CALL.END_SESSION(sessionId),
      data
    );
    return response.data!;
  }

  /**
   * Get call session details
   * @param sessionId - Session ID
   * @returns Promise<ChatSession>
   */
  async getSessionDetails(sessionId: string): Promise<ChatSession> {
    const response = await apiClient.get<ApiResponse<ChatSession>>(
      API_ENDPOINTS.CALL.SESSION_DETAILS(sessionId)
    );
    return response.data!;
  }

  /**
   * Rate a completed call session
   * @param sessionId - Session ID
   * @param rating - Rating (1-5)
   * @param review - Review text (optional)
   * @param tags - Review tags (optional)
   * @returns Promise<any>
   */
  async rateSession(
    sessionId: string,
    rating: number,
    review?: string,
    tags?: string[]
  ): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.CALL.RATING(sessionId),
      { rating, review, tags }
    );
    return response.data!;
  }

  /**
   * Get call session history
   * @param filters - Filter options
   * @returns Promise<ChatSession[]>
   */
  async getSessionHistory(filters?: {
    status?: 'active' | 'completed' | 'cancelled';
    astrologerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ChatSession[]; pagination: Pagination }> {
    const response = await apiClient.get<ApiResponse<ChatSession[]>>(
      API_ENDPOINTS.CALL.SESSIONS,
      { params: filters }
    );
    return {
      data: response.data || [],
      pagination: response.pagination!,
    };
  }
}

export const callService = new CallService();
