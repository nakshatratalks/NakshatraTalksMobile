/**
 * API Client
 * Axios client with request/response interceptors
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../config/api.config';

class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Load token if not already loaded
        if (!this.authToken) {
          this.authToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        }

        // Add Authorization header if token exists
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle 401 Unauthorized - Token expired
        if (error.response?.status === 401) {
          await this.clearAuthToken();
          // You can emit an event here to trigger logout in your app
          // EventEmitter.emit('UNAUTHORIZED');
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication token
   * @param token - JWT token
   */
  async setAuthToken(token: string) {
    this.authToken = token;
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  /**
   * Clear authentication token
   */
  async clearAuthToken() {
    this.authToken = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Get current auth token
   * @returns string | null
   */
  async getAuthToken(): Promise<string | null> {
    if (!this.authToken) {
      this.authToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    return this.authToken;
  }

  /**
   * Check if user is authenticated
   * @returns boolean
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }

  /**
   * Generic GET request
   * @param url - Endpoint URL
   * @param config - Axios config
   * @returns Promise<T>
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Generic POST request
   * @param url - Endpoint URL
   * @param data - Request body
   * @param config - Axios config
   * @returns Promise<T>
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PUT request
   * @param url - Endpoint URL
   * @param data - Request body
   * @param config - Axios config
   * @returns Promise<T>
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PATCH request
   * @param url - Endpoint URL
   * @param data - Request body
   * @param config - Axios config
   * @returns Promise<T>
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request
   * @param url - Endpoint URL
   * @param config - Axios config
   * @returns Promise<T>
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * GET request with query parameters
   * @param url - Endpoint URL
   * @param params - Query parameters
   * @returns Promise<T>
   */
  async getWithParams<T>(url: string, params: Record<string, any>): Promise<T> {
    return this.get<T>(url, { params });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
