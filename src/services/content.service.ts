/**
 * Content Service
 * Handles categories, banners, and other content
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import { Category, Banner, ApiResponse } from '../types/api.types';

class ContentService {
  /**
   * Get all categories
   * @returns Promise<Category[]>
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<ApiResponse<Category[]>>(
      API_ENDPOINTS.CONTENT.CATEGORIES
    );
    return response.data!;
  }

  /**
   * Get all active banners
   * @returns Promise<Banner[]>
   */
  async getBanners(): Promise<Banner[]> {
    const response = await apiClient.get<ApiResponse<Banner[]>>(
      API_ENDPOINTS.CONTENT.BANNERS
    );
    return response.data!;
  }
}

export const contentService = new ContentService();
