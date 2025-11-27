/**
 * Call Service
 * Handles call-related API calls including request-accept flow and queue management
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
import {
  CreateCallRequestResponse,
  PollCallRequestStatusResponse,
  JoinQueueResponse,
  QueueEntry,
  QueueInfo,
  EndCallResponse,
  CallRatingRequest,
} from '../types/call.types';

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

  // ==================== Call Request Flow ====================

  /**
   * Create a new call request
   * Astrologer has 60 seconds to accept/reject
   * @param astrologerId - Astrologer ID
   * @returns Promise<CreateCallRequestResponse>
   */
  async createCallRequest(astrologerId: string): Promise<CreateCallRequestResponse> {
    const response = await apiClient.post<ApiResponse<CreateCallRequestResponse>>(
      API_ENDPOINTS.CALL.REQUEST,
      { astrologerId }
    );
    return response.data!;
  }

  /**
   * Get user's pending call request
   * @returns Promise<CreateCallRequestResponse | null>
   */
  async getPendingRequest(): Promise<CreateCallRequestResponse | null> {
    const response = await apiClient.get<ApiResponse<CreateCallRequestResponse>>(
      API_ENDPOINTS.CALL.PENDING_REQUEST
    );
    return response.data || null;
  }

  /**
   * Poll call request status
   * Use this to check if astrologer accepted/rejected
   * @param requestId - Request ID
   * @returns Promise<PollCallRequestStatusResponse>
   */
  async pollRequestStatus(requestId: string): Promise<PollCallRequestStatusResponse> {
    const response = await apiClient.get<ApiResponse<PollCallRequestStatusResponse>>(
      API_ENDPOINTS.CALL.REQUEST_STATUS(requestId)
    );
    return response.data!;
  }

  /**
   * Cancel a pending call request
   * @param requestId - Request ID
   * @returns Promise<void>
   */
  async cancelRequest(requestId: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.CALL.CANCEL_REQUEST(requestId)
    );
  }

  // ==================== Queue Management ====================

  /**
   * Get queue info for an astrologer (public)
   * @param astrologerId - Astrologer ID
   * @returns Promise<QueueInfo>
   */
  async getQueueInfo(astrologerId: string): Promise<QueueInfo> {
    const response = await apiClient.get<ApiResponse<QueueInfo>>(
      API_ENDPOINTS.CALL.QUEUE_INFO(astrologerId)
    );
    return response.data!;
  }

  /**
   * Join an astrologer's queue
   * Max 10 users, 10 min timeout
   * @param astrologerId - Astrologer ID
   * @returns Promise<JoinQueueResponse>
   */
  async joinQueue(astrologerId: string): Promise<JoinQueueResponse> {
    const response = await apiClient.post<ApiResponse<JoinQueueResponse>>(
      API_ENDPOINTS.CALL.QUEUE_JOIN,
      { astrologerId }
    );
    return response.data!;
  }

  /**
   * Get all queue entries for current user
   * @returns Promise<QueueEntry[]>
   */
  async getQueueStatus(): Promise<QueueEntry[]> {
    const response = await apiClient.get<ApiResponse<QueueEntry[]>>(
      API_ENDPOINTS.CALL.QUEUE_STATUS
    );
    return response.data || [];
  }

  /**
   * Get queue position for specific astrologer
   * @param astrologerId - Astrologer ID
   * @returns Promise<QueueEntry | null>
   */
  async getQueuePosition(astrologerId: string): Promise<QueueEntry | null> {
    const response = await apiClient.get<ApiResponse<QueueEntry>>(
      API_ENDPOINTS.CALL.QUEUE_POSITION(astrologerId)
    );
    return response.data || null;
  }

  /**
   * Leave a queue
   * @param queueId - Queue entry ID
   * @returns Promise<void>
   */
  async leaveQueue(queueId: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.CALL.QUEUE_LEAVE(queueId)
    );
  }

  /**
   * Initiate call when turn comes in queue
   * @param queueId - Queue entry ID
   * @returns Promise<CreateCallRequestResponse>
   */
  async callNowFromQueue(queueId: string): Promise<CreateCallRequestResponse> {
    const response = await apiClient.post<ApiResponse<CreateCallRequestResponse>>(
      API_ENDPOINTS.CALL.QUEUE_CALL_NOW(queueId)
    );
    return response.data!;
  }

  // ==================== Session Management ====================

  /**
   * Start a new call session (legacy - use createCallRequest for new flow)
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
   * @param endReason - Reason for ending
   * @returns Promise<EndCallResponse>
   */
  async endSession(sessionId: string, endReason?: string): Promise<EndCallResponse> {
    const response = await apiClient.post<ApiResponse<EndCallResponse>>(
      API_ENDPOINTS.CALL.END_SESSION(sessionId),
      { endReason }
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
   * @param data - Rating data
   * @returns Promise<void>
   */
  async rateSession(sessionId: string, data: CallRatingRequest): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.CALL.RATING(sessionId),
      data
    );
  }

  /**
   * Get call session history
   * @param filters - Filter options
   * @returns Promise<{ data: ChatSession[]; pagination: Pagination }>
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
