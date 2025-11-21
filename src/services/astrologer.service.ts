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
}

export const astrologerService = new AstrologerService();
