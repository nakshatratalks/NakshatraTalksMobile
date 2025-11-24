/**
 * Live Session Service
 * Handles live session-related API calls
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import {
  LiveSession,
  LiveSessionMessage,
  LiveSessionViewer,
  CreateLiveSessionData,
  UpdateLiveSessionData,
  JoinLiveSessionResponse,
  SendMessageData,
} from '../types/liveSession.types';
import { ApiResponse } from '../types/api.types';

class LiveSessionService {
  /**
   * Get all active live sessions
   * @param limit - Number of results to return (default: 20)
   * @returns Promise<LiveSession[]>
   */
  async getLiveSessions(limit: number = 20): Promise<LiveSession[]> {
    const response = await apiClient.get<ApiResponse<LiveSession[]>>(
      API_ENDPOINTS.LIVE_SESSIONS.LIST,
      { params: { status: 'live', limit } }
    );
    return response.data!;
  }

  /**
   * Get a specific live session by ID
   * @param sessionId - Live session ID
   * @returns Promise<LiveSession>
   */
  async getLiveSession(sessionId: string): Promise<LiveSession> {
    const response = await apiClient.get<ApiResponse<LiveSession>>(
      API_ENDPOINTS.LIVE_SESSIONS.DETAILS(sessionId)
    );
    return response.data!;
  }

  /**
   * Join a live session
   * @param sessionId - Live session ID
   * @returns Promise<JoinLiveSessionResponse>
   */
  async joinSession(sessionId: string): Promise<JoinLiveSessionResponse> {
    const response = await apiClient.post<ApiResponse<JoinLiveSessionResponse>>(
      API_ENDPOINTS.LIVE_SESSIONS.JOIN(sessionId)
    );
    return response.data!;
  }

  /**
   * Leave a live session
   * @param sessionId - Live session ID
   * @returns Promise<void>
   */
  async leaveSession(sessionId: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.LIVE_SESSIONS.LEAVE(sessionId)
    );
  }

  /**
   * Get messages for a live session
   * @param sessionId - Live session ID
   * @param limit - Number of messages to return (default: 50)
   * @returns Promise<LiveSessionMessage[]>
   */
  async getSessionMessages(
    sessionId: string,
    limit: number = 50
  ): Promise<LiveSessionMessage[]> {
    const response = await apiClient.get<ApiResponse<LiveSessionMessage[]>>(
      API_ENDPOINTS.LIVE_SESSIONS.MESSAGES(sessionId),
      { params: { limit } }
    );
    return response.data!;
  }

  /**
   * Send a message in a live session
   * @param sessionId - Live session ID
   * @param message - Message content
   * @returns Promise<LiveSessionMessage>
   */
  async sendMessage(
    sessionId: string,
    message: string
  ): Promise<LiveSessionMessage> {
    const data: SendMessageData = {
      message,
      type: 'text',
    };
    const response = await apiClient.post<ApiResponse<LiveSessionMessage>>(
      API_ENDPOINTS.LIVE_SESSIONS.SEND_MESSAGE(sessionId),
      data
    );
    return response.data!;
  }

  /**
   * Get viewers for a live session
   * @param sessionId - Live session ID
   * @returns Promise<LiveSessionViewer[]>
   */
  async getSessionViewers(sessionId: string): Promise<LiveSessionViewer[]> {
    const response = await apiClient.get<ApiResponse<LiveSessionViewer[]>>(
      API_ENDPOINTS.LIVE_SESSIONS.VIEWERS(sessionId)
    );
    return response.data!;
  }

  /**
   * Follow/Unfollow an astrologer during live session
   * @param astrologerId - Astrologer ID
   * @param action - 'follow' or 'unfollow'
   * @returns Promise<void>
   */
  async toggleFollow(astrologerId: string, action: 'follow' | 'unfollow'): Promise<void> {
    const endpoint = action === 'follow'
      ? API_ENDPOINTS.ASTROLOGERS.FOLLOW(astrologerId)
      : API_ENDPOINTS.ASTROLOGERS.UNFOLLOW(astrologerId);

    await apiClient.post<ApiResponse<void>>(endpoint);
  }

  // ============================================
  // ASTROLOGER-SIDE METHODS (for reference)
  // These would be called from the astrologer dashboard
  // ============================================

  /**
   * Create a new live session (Astrologer-side)
   * @param data - Session creation data
   * @returns Promise<LiveSession>
   */
  async createSession(data: CreateLiveSessionData): Promise<LiveSession> {
    const response = await apiClient.post<ApiResponse<LiveSession>>(
      API_ENDPOINTS.LIVE_SESSIONS.CREATE,
      data
    );
    return response.data!;
  }

  /**
   * Update a live session (Astrologer-side)
   * @param sessionId - Live session ID
   * @param data - Session update data
   * @returns Promise<LiveSession>
   */
  async updateSession(
    sessionId: string,
    data: UpdateLiveSessionData
  ): Promise<LiveSession> {
    const response = await apiClient.put<ApiResponse<LiveSession>>(
      API_ENDPOINTS.LIVE_SESSIONS.UPDATE(sessionId),
      data
    );
    return response.data!;
  }

  /**
   * Start a live session (Astrologer-side)
   * @param sessionId - Live session ID
   * @returns Promise<LiveSession>
   */
  async startSession(sessionId: string): Promise<LiveSession> {
    const response = await apiClient.post<ApiResponse<LiveSession>>(
      API_ENDPOINTS.LIVE_SESSIONS.START(sessionId)
    );
    return response.data!;
  }

  /**
   * End a live session (Astrologer-side)
   * @param sessionId - Live session ID
   * @returns Promise<LiveSession>
   */
  async endSession(sessionId: string): Promise<LiveSession> {
    const response = await apiClient.post<ApiResponse<LiveSession>>(
      API_ENDPOINTS.LIVE_SESSIONS.END(sessionId)
    );
    return response.data!;
  }
}

export const liveSessionService = new LiveSessionService();
