/**
 * Matching Service
 * API service for Kundli Matching (Ashtakoot) endpoints
 * Protected API - Requires JWT authentication
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import { ApiResponse, Pagination } from '../types/api.types';
import {
  SavedMatching,
  MatchingInput,
  MatchingReport,
  MatchingListParams,
} from '../types/kundli';

/**
 * Matching list response type
 */
interface MatchingListResponse {
  data: SavedMatching[];
  pagination: Pagination;
}

/**
 * Kundli Matching API Service
 */
export const matchingService = {
  /**
   * Generate a new matching report (Ashtakoot compatibility analysis)
   * @param input - Matching input data with boy and girl details
   * @returns Promise<SavedMatching>
   */
  generate: async (input: MatchingInput): Promise<SavedMatching> => {
    const response = await apiClient.post<ApiResponse<SavedMatching>>(
      API_ENDPOINTS.MATCHING.GENERATE,
      input
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to generate matching report');
    }

    return response.data;
  },

  /**
   * List saved matching reports with pagination
   * @param params - Query parameters for filtering
   * @returns Promise<MatchingListResponse>
   */
  list: async (params: MatchingListParams = {}): Promise<MatchingListResponse> => {
    const queryParams: Record<string, any> = {};

    if (params.search) queryParams.search = params.search;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;

    const response = await apiClient.getWithParams<ApiResponse<SavedMatching[]> & { pagination: Pagination }>(
      API_ENDPOINTS.MATCHING.LIST,
      queryParams
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch matching list');
    }

    return {
      data: response.data,
      pagination: response.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: response.data.length,
        itemsPerPage: params.limit || 20,
        hasNext: false,
        hasPrev: false,
      },
    };
  },

  /**
   * Get a matching by ID (basic info with score)
   * @param matchingId - Matching ID
   * @returns Promise<SavedMatching>
   */
  getById: async (matchingId: string): Promise<SavedMatching> => {
    const response = await apiClient.get<ApiResponse<SavedMatching>>(
      API_ENDPOINTS.MATCHING.GET_BY_ID(matchingId)
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch matching');
    }

    return response.data;
  },

  /**
   * Get full matching report (Ashtakoot analysis, doshas, recommendations)
   * @param matchingId - Matching ID
   * @returns Promise<MatchingReport>
   */
  getReport: async (matchingId: string): Promise<MatchingReport> => {
    const response = await apiClient.get<ApiResponse<MatchingReport>>(
      API_ENDPOINTS.MATCHING.GET_REPORT(matchingId)
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch matching report');
    }

    return response.data;
  },

  /**
   * Delete a matching report permanently
   * @param matchingId - Matching ID
   * @returns Promise<void>
   */
  delete: async (matchingId: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<null>>(
      API_ENDPOINTS.MATCHING.DELETE(matchingId)
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete matching report');
    }
  },
};
