/**
 * Chat Service
 * Handles chat-related API calls
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import {
  Astrologer,
  SearchFilters,
  ApiResponse,
  Pagination,
  BalanceValidationResponse,
  CreateSessionData,
  ChatSession,
  EndSessionData,
  ChatMessage,
} from '../types/api.types';

interface AvailableChatAstrologersResponse {
  data: Astrologer[];
  pagination: Pagination;
  message: string;
}

class ChatService {
  /**
   * Get available astrologers for chat
   * @param filters - Search filters
   * @returns Promise<AvailableChatAstrologersResponse>
   */
  async getAvailableAstrologers(
    filters?: SearchFilters
  ): Promise<AvailableChatAstrologersResponse> {
    const response = await apiClient.get<ApiResponse<Astrologer[]>>(
      API_ENDPOINTS.CHAT.AVAILABLE_ASTROLOGERS,
      { params: filters }
    );

    return {
      data: response.data || [],
      pagination: response.pagination!,
      message: response.message || 'Available chat astrologers fetched successfully',
    };
  }

  /**
   * Validate user balance before starting chat
   * @param astrologerId - Astrologer ID
   * @returns Promise<BalanceValidationResponse>
   */
  async validateBalance(astrologerId: string): Promise<BalanceValidationResponse> {
    const response = await apiClient.post<ApiResponse<BalanceValidationResponse>>(
      API_ENDPOINTS.CHAT.VALIDATE_BALANCE,
      { astrologerId }
    );
    return response.data!;
  }

  /**
   * Start a new chat session
   * @param data - Session creation data
   * @returns Promise<ChatSession>
   */
  async startSession(data: CreateSessionData): Promise<ChatSession> {
    const response = await apiClient.post<ApiResponse<ChatSession>>(
      API_ENDPOINTS.CHAT.SESSIONS,
      data
    );
    return response.data!;
  }

  /**
   * Get active chat session
   * @returns Promise<ChatSession | null>
   */
  async getActiveSession(): Promise<ChatSession | null> {
    const response = await apiClient.get<ApiResponse<ChatSession>>(
      API_ENDPOINTS.CHAT.ACTIVE_SESSION
    );
    return response.data || null;
  }

  /**
   * End a chat session
   * @param sessionId - Session ID
   * @param data - End session data
   * @returns Promise<any>
   */
  async endSession(sessionId: string, data?: EndSessionData): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.CHAT.END_SESSION(sessionId),
      data
    );
    return response.data!;
  }

  /**
   * Get messages for a chat session
   * @param sessionId - Session ID
   * @param limit - Number of messages to fetch
   * @returns Promise<ChatMessage[]>
   */
  async getMessages(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    const response = await apiClient.get<ApiResponse<ChatMessage[]>>(
      API_ENDPOINTS.CHAT.MESSAGES(sessionId),
      { params: { limit } }
    );
    return response.data || [];
  }

  /**
   * Send a message in a chat session
   * @param sessionId - Session ID
   * @param message - Message text
   * @param type - Message type (text, image, file)
   * @returns Promise<ChatMessage>
   */
  async sendMessage(
    sessionId: string,
    message: string,
    type: 'text' | 'image' | 'file' = 'text'
  ): Promise<ChatMessage> {
    const response = await apiClient.post<ApiResponse<ChatMessage>>(
      API_ENDPOINTS.CHAT.MESSAGES(sessionId),
      { message, type }
    );
    return response.data!;
  }

  /**
   * Rate a completed chat session
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
      API_ENDPOINTS.CHAT.RATING(sessionId),
      { rating, review, tags }
    );
    return response.data!;
  }

  /**
   * Get chat session history
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
      API_ENDPOINTS.CHAT.SESSIONS,
      { params: filters }
    );
    return {
      data: response.data || [],
      pagination: response.pagination!,
    };
  }
}

export const chatService = new ChatService();
