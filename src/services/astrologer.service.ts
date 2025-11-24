/**
 * Astrologer Service
 * Handles astrologer-related API calls
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import { Astrologer, SearchFilters, SearchResults, ApiResponse, Review } from '../types/api.types';

class AstrologerService {
  /**
   * Get live astrologers
   * @param limit - Number of results to return (default: 10)
   * @returns Promise<Astrologer[]>
   */
  async getLiveAstrologers(limit: number = 10): Promise<Astrologer[]> {
    const response = await apiClient.get<ApiResponse<Astrologer[]>>(
      API_ENDPOINTS.ASTROLOGERS.LIVE,
      { params: { limit } }
    );
    return response.data!;
  }

  /**
   * Get top-rated astrologers
   * @param limit - Number of results to return (default: 10)
   * @param sortBy - Sort field (default: rating)
   * @param order - Sort order (default: desc)
   * @returns Promise<Astrologer[]>
   */
  async getTopRatedAstrologers(
    limit: number = 10,
    sortBy: string = 'rating',
    order: string = 'desc'
  ): Promise<Astrologer[]> {
    const response = await apiClient.get<ApiResponse<Astrologer[]>>(
      API_ENDPOINTS.ASTROLOGERS.TOP_RATED,
      { params: { limit, sortBy, order } }
    );
    return response.data!;
  }

  /**
   * Get astrologer details by ID
   * @param id - Astrologer ID
   * @returns Promise<Astrologer>
   */
  async getAstrologerDetails(id: string): Promise<Astrologer> {
    const response = await apiClient.get<ApiResponse<Astrologer>>(
      API_ENDPOINTS.ASTROLOGERS.DETAILS(id)
    );
    return response.data!;
  }

  /**
   * Search astrologers with filters
   * @param filters - Search filters
   * @returns Promise<SearchResults>
   */
  async searchAstrologers(filters: SearchFilters): Promise<SearchResults> {
    const response = await apiClient.get<ApiResponse<SearchResults>>(
      API_ENDPOINTS.ASTROLOGERS.SEARCH,
      { params: filters }
    );
    return response.data!;
  }

  /**
   * Submit review for astrologer
   * @param astrologerId - Astrologer ID
   * @param data - Review data
   * @returns Promise<any>
   */
  async submitReview(
    astrologerId: string,
    data: {
      rating: number;
      comment?: string;
      tags?: string[];
      sessionId: string;
    }
  ): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.ASTROLOGERS.REVIEWS(astrologerId),
      data
    );
    return response.data!;
  }

  // ==================== API v2.0.0 Methods ====================

  /**
   * Get available astrologers (API v2.0.0)
   * @param type - Filter by availability type: 'chat', 'call', or 'any'
   * @param limit - Maximum results (default: 20)
   * @returns Promise<Astrologer[]>
   */
  async getAvailableAstrologers(
    type: 'chat' | 'call' | 'any' = 'any',
    limit: number = 20
  ): Promise<Astrologer[]> {
    const response = await apiClient.get<ApiResponse<Astrologer[]>>(
      API_ENDPOINTS.ASTROLOGERS.AVAILABLE,
      { params: { type, limit } }
    );
    return response.data!;
  }

  /**
   * Get astrologer statistics (API v2.0.0)
   * Requires authentication - astrologer can view own stats, admin can view any
   * @param astrologerId - Astrologer ID
   * @returns Promise<any>
   */
  async getAstrologerStats(astrologerId: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      API_ENDPOINTS.ASTROLOGERS.STATS(astrologerId)
    );
    return response.data!;
  }

  /**
   * Get astrologer working hours (API v2.0.0)
   * @param astrologerId - Astrologer ID
   * @returns Promise<Record<string, string>>
   */
  async getWorkingHours(astrologerId: string): Promise<Record<string, string>> {
    const response = await apiClient.get<ApiResponse<Record<string, string>>>(
      API_ENDPOINTS.ASTROLOGERS.WORKING_HOURS(astrologerId)
    );
    return response.data!;
  }

  /**
   * Update astrologer working hours (API v2.0.0)
   * Requires authentication - astrologer or admin
   * @param astrologerId - Astrologer ID
   * @param workingHours - Working hours object (day: "HH:MM-HH:MM" format)
   * @returns Promise<Record<string, string>>
   */
  async updateWorkingHours(
    astrologerId: string,
    workingHours: Record<string, string>
  ): Promise<Record<string, string>> {
    const response = await apiClient.patch<ApiResponse<Record<string, string>>>(
      API_ENDPOINTS.ASTROLOGERS.WORKING_HOURS(astrologerId),
      { workingHours }
    );
    return response.data!;
  }

  /**
   * Toggle astrologer availability (API v2.0.0)
   * Requires authentication - astrologer or admin
   * @param astrologerId - Astrologer ID
   * @param isAvailable - Availability status
   * @returns Promise<any>
   */
  async toggleAvailability(
    astrologerId: string,
    isAvailable: boolean
  ): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(
      API_ENDPOINTS.ASTROLOGERS.TOGGLE_AVAILABILITY(astrologerId),
      { isAvailable }
    );
    return response.data!;
  }

  /**
   * Upload photo to astrologer gallery (API v2.0.0)
   * Requires authentication - astrologer or admin
   * @param astrologerId - Astrologer ID
   * @param photoFile - Photo file (FormData)
   * @returns Promise<any>
   */
  async uploadPhoto(astrologerId: string, photoFile: FormData): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.ASTROLOGERS.PHOTOS(astrologerId),
      photoFile,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data!;
  }

  /**
   * Get astrologer photos (API v2.0.0)
   * @param astrologerId - Astrologer ID
   * @returns Promise<any[]>
   */
  async getPhotos(astrologerId: string): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      API_ENDPOINTS.ASTROLOGERS.PHOTOS(astrologerId)
    );
    return response.data!;
  }

  /**
   * Delete photo from astrologer gallery (API v2.0.0)
   * Requires authentication - astrologer or admin
   * @param astrologerId - Astrologer ID
   * @param photoId - Photo ID
   * @returns Promise<any>
   */
  async deletePhoto(astrologerId: string, photoId: string): Promise<any> {
    const response = await apiClient.delete<ApiResponse<any>>(
      API_ENDPOINTS.ASTROLOGERS.PHOTO_DELETE(astrologerId, photoId)
    );
    return response.data!;
  }

  /**
   * Reorder astrologer photos (API v2.0.0)
   * Requires authentication - astrologer or admin
   * @param astrologerId - Astrologer ID
   * @param photoOrders - Array of photo IDs with their new order
   * @returns Promise<any>
   */
  async reorderPhotos(
    astrologerId: string,
    photoOrders: Array<{ id: string; order: number }>
  ): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(
      API_ENDPOINTS.ASTROLOGERS.PHOTO_REORDER(astrologerId),
      { photoOrders }
    );
    return response.data!;
  }
}

export const astrologerService = new AstrologerService();
