/**
 * Kundli Service
 * API service for Kundli (Birth Chart) endpoints
 * Protected API - Requires JWT authentication
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import { ApiResponse, Pagination } from '../types/api.types';
import {
  SavedKundli,
  KundliInput,
  KundliReport,
  KundliListParams,
  ChartStyle,
} from '../types/kundli';

/**
 * Report query parameters
 */
export interface KundliReportParams {
  language?: 'en' | 'ta';
  chartStyle?: ChartStyle;
  refresh?: boolean;
}

/**
 * Kundli list response type
 */
interface KundliListResponse {
  data: SavedKundli[];
  pagination: Pagination;
}

/**
 * Kundli API Service
 */
export const kundliService = {
  /**
   * Generate a new Kundli (birth chart)
   * @param input - Kundli input data
   * @returns Promise<SavedKundli>
   */
  generate: async (input: KundliInput): Promise<SavedKundli> => {
    const response = await apiClient.post<ApiResponse<SavedKundli>>(
      API_ENDPOINTS.KUNDLI.GENERATE,
      input
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to generate kundli');
    }

    return response.data;
  },

  /**
   * List saved kundlis with pagination
   * @param params - Query parameters for filtering/sorting
   * @returns Promise<KundliListResponse>
   */
  list: async (params: KundliListParams = {}): Promise<KundliListResponse> => {
    const queryParams: Record<string, any> = {};

    if (params.search) queryParams.search = params.search;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;

    const response = await apiClient.getWithParams<ApiResponse<SavedKundli[]> & { pagination: Pagination }>(
      API_ENDPOINTS.KUNDLI.LIST,
      queryParams
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch kundli list');
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
   * Get a kundli by ID
   * @param kundliId - Kundli ID
   * @returns Promise<SavedKundli>
   */
  getById: async (kundliId: string): Promise<SavedKundli> => {
    const response = await apiClient.get<ApiResponse<SavedKundli>>(
      API_ENDPOINTS.KUNDLI.GET_BY_ID(kundliId)
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch kundli');
    }

    return response.data;
  },

  /**
   * Get full kundli report (planetary positions, doshas, dashas, etc.)
   * @param kundliId - Kundli ID
   * @param params - Optional query parameters (language, chartStyle, refresh)
   * @returns Promise<KundliReport>
   */
  getReport: async (kundliId: string, params: KundliReportParams = {}): Promise<KundliReport> => {
    const queryParams: Record<string, any> = {};

    if (params.language) queryParams.language = params.language;
    if (params.chartStyle) {
      // Convert from 'south_indian' to 'south-indian' format
      queryParams.chartStyle = params.chartStyle.replace('_', '-');
    }
    if (params.refresh) queryParams.refresh = 'true';

    const response = await apiClient.getWithParams<ApiResponse<KundliReport>>(
      API_ENDPOINTS.KUNDLI.GET_REPORT(kundliId),
      queryParams
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch kundli report');
    }

    return response.data;
  },

  /**
   * Update an existing kundli
   * Note: Updating birth details will clear cached report
   * @param kundliId - Kundli ID
   * @param input - Partial kundli input data
   * @returns Promise<SavedKundli>
   */
  update: async (kundliId: string, input: Partial<KundliInput>): Promise<SavedKundli> => {
    const response = await apiClient.put<ApiResponse<SavedKundli>>(
      API_ENDPOINTS.KUNDLI.UPDATE(kundliId),
      input
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update kundli');
    }

    return response.data;
  },

  /**
   * Delete a kundli permanently
   * @param kundliId - Kundli ID
   * @returns Promise<void>
   */
  delete: async (kundliId: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<null>>(
      API_ENDPOINTS.KUNDLI.DELETE(kundliId)
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete kundli');
    }
  },
};
