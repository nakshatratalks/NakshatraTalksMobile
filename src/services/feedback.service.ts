/**
 * Feedback Service
 * Handles feedback submission
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import { FeedbackData, ApiResponse } from '../types/api.types';

class FeedbackService {
  /**
   * Submit feedback
   * @param data - Feedback data (name, email, comments, rating, category)
   * @returns Promise<any>
   */
  async submitFeedback(data: FeedbackData): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.FEEDBACK,
      data
    );
    return response.data!;
  }
}

export const feedbackService = new FeedbackService();
