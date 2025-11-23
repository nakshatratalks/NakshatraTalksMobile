/**
 * Error Handler Utility
 * Centralized error handling for API requests
 */

import { AxiosError } from 'axios';
import { ApiError, ErrorCode } from '../types/api.types';
import NotificationService from './notificationService';

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
            NotificationService.warning(
              'Please recharge your wallet to continue.',
              'Insufficient Balance'
            );
          }
        } else if (showAlert) {
          NotificationService.error(errorMessage, 'Invalid Request');
        }
        break;

      case 401:
        // Token expired or invalid
        if (onUnauthorized) {
          onUnauthorized();
        }
        if (showAlert) {
          NotificationService.error('Please sign in again.', 'Session Expired');
        }
        break;

      case 403:
        if (onForbidden) {
          onForbidden();
        }
        if (showAlert) {
          NotificationService.error(errorMessage, 'Access Denied');
        }
        break;

      case 404:
        if (showAlert) {
          NotificationService.error('The requested resource was not found.', 'Not Found');
        }
        break;

      case 409:
        if (showAlert) {
          NotificationService.error(errorMessage, 'Conflict');
        }
        break;

      case 429:
        if (showAlert) {
          NotificationService.warning('Please try again later.', 'Too Many Requests');
        }
        break;

      case 500:
        if (showAlert) {
          NotificationService.error('Something went wrong. Please try again.', 'Server Error');
        }
        break;

      default:
        if (showAlert) {
          NotificationService.error(errorMessage, 'Error');
        }
    }
  } else if (error.request) {
    // No response received (network error)
    errorMessage = 'Please check your internet connection and try again.';
    errorCode = 'NETWORK_ERROR';

    if (showAlert) {
      NotificationService.error(errorMessage, 'Network Error');
    }
  } else {
    // Error setting up request
    if (showAlert) {
      NotificationService.error(errorMessage, 'Error');
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
 * Show error notification with custom options
 *
 * @param title - Notification title
 * @param message - Notification message
 */
export const showErrorAlert = (
  title: string,
  message: string
) => {
  NotificationService.error(message, title);
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
