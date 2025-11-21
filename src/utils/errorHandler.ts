/**
 * Error Handler Utility
 * Centralized error handling for API requests
 */

import { Alert } from 'react-native';
import { AxiosError } from 'axios';
import { ApiError, ErrorCode } from '../types/api.types';

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  customMessage?: string;
  onUnauthorized?: () => void;
  onForbidden?: () => void;
}

/**
 * Handle API errors with user-friendly messages
 *
 * @param error - Error object from API call
 * @param options - Options for error handling
 * @returns ApiError | null
 */
export const handleApiError = (
  error: any,
  options: ErrorHandlerOptions = {}
): ApiError | null => {
  const {
    showAlert = true,
    customMessage,
    onUnauthorized,
    onForbidden,
  } = options;

  let errorMessage = customMessage || 'An unexpected error occurred';
  let errorCode = 'UNKNOWN_ERROR';
  let statusCode = 500;

  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    statusCode = status;

    if (data?.error) {
      errorCode = data.error.code || data.error;
      errorMessage = data.error.message || data.message || errorMessage;
    } else if (data?.message) {
      errorMessage = data.message;
    }

    // Handle specific status codes
    switch (status) {
      case 400:
        if (errorCode === 'INSUFFICIENT_BALANCE') {
          if (showAlert) {
            Alert.alert(
              'Insufficient Balance',
              'Please recharge your wallet to continue.',
              [{ text: 'OK' }]
            );
          }
        } else if (showAlert) {
          Alert.alert('Invalid Request', errorMessage);
        }
        break;

      case 401:
        // Token expired or invalid
        if (onUnauthorized) {
          onUnauthorized();
        }
        if (showAlert) {
          Alert.alert('Session Expired', 'Please sign in again.');
        }
        break;

      case 403:
        if (onForbidden) {
          onForbidden();
        }
        if (showAlert) {
          Alert.alert('Access Denied', errorMessage);
        }
        break;

      case 404:
        if (showAlert) {
          Alert.alert('Not Found', 'The requested resource was not found.');
        }
        break;

      case 409:
        if (showAlert) {
          Alert.alert('Conflict', errorMessage);
        }
        break;

      case 429:
        if (showAlert) {
          Alert.alert('Too Many Requests', 'Please try again later.');
        }
        break;

      case 500:
        if (showAlert) {
          Alert.alert('Server Error', 'Something went wrong. Please try again.');
        }
        break;

      default:
        if (showAlert) {
          Alert.alert('Error', errorMessage);
        }
    }
  } else if (error.request) {
    // No response received (network error)
    errorMessage = 'Please check your internet connection and try again.';
    errorCode = 'NETWORK_ERROR';

    if (showAlert) {
      Alert.alert('Network Error', errorMessage);
    }
  } else {
    // Error setting up request
    if (showAlert) {
      Alert.alert('Error', errorMessage);
    }
  }

  return {
    code: errorCode,
    message: errorMessage,
    details: error.response?.data,
  };
};

/**
 * Get user-friendly error message based on error code
 *
 * @param code - Error code from API
 * @returns string - User-friendly error message
 */
export const getErrorMessage = (code: string): string => {
  const errorMessages: Record<string, string> = {
    // Validation Errors
    [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ErrorCode.INVALID_PHONE]: 'Invalid phone number format. Use +919876543210',
    [ErrorCode.INVALID_OTP]: 'Invalid OTP. Please check and try again.',
    [ErrorCode.INVALID_RATING]: 'Rating must be between 1 and 5.',

    // Authentication Errors
    [ErrorCode.UNAUTHORIZED]: 'Please sign in to continue.',
    [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
    [ErrorCode.INVALID_TOKEN]: 'Invalid authentication token.',

    // Authorization Errors
    [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions.',

    // Resource Errors
    [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorCode.USER_NOT_FOUND]: 'User not found.',
    [ErrorCode.ASTROLOGER_NOT_FOUND]: 'Astrologer not found.',
    [ErrorCode.SESSION_NOT_FOUND]: 'Session not found.',

    // Conflict Errors
    [ErrorCode.CONFLICT]: 'This resource already exists.',
    [ErrorCode.ALREADY_EXISTS]: 'This item already exists.',
    [ErrorCode.ALREADY_REVIEWED]: 'You have already reviewed this session.',

    // Business Logic Errors
    [ErrorCode.INSUFFICIENT_BALANCE]: 'Insufficient wallet balance. Please recharge.',
    [ErrorCode.ASTROLOGER_NOT_AVAILABLE]: 'Astrologer is not currently available.',
    [ErrorCode.SESSION_NOT_ACTIVE]: 'Session is not active.',

    // Rate Limiting
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
    [ErrorCode.TOO_MANY_OTP_REQUESTS]: 'Too many OTP requests. Please wait and try again.',

    // Server Errors
    [ErrorCode.SERVER_ERROR]: 'Server error. Please try again later.',
    [ErrorCode.DATABASE_ERROR]: 'Database error. Please try again later.',
  };

  return errorMessages[code] || 'An unexpected error occurred.';
};

/**
 * Show error alert with custom options
 *
 * @param title - Alert title
 * @param message - Alert message
 * @param buttons - Alert buttons
 */
export const showErrorAlert = (
  title: string,
  message: string,
  buttons?: any[]
) => {
  Alert.alert(title, message, buttons || [{ text: 'OK' }]);
};

/**
 * Check if error is network error
 *
 * @param error - Error object
 * @returns boolean
 */
export const isNetworkError = (error: any): boolean => {
  return !error.response && !!error.request;
};

/**
 * Check if error is authentication error
 *
 * @param error - Error object
 * @returns boolean
 */
export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401;
};

/**
 * Extract error message from various error formats
 *
 * @param error - Error object
 * @returns string - Error message
 */
export const extractErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error.response?.data) {
    const { data } = error.response;
    return data.error?.message || data.message || 'An error occurred';
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};
