/**
 * API Response Handler Utility
 * Handles API responses with custom status codes
 */

import { AxiosResponse } from 'axios';
import { getStatusMessage, isSuccessCode, STATUS_CODES } from './statusCodes';

/**
 * Standard API Response structure from backend
 */
export interface ApiResponse<T = unknown> {
  error: boolean;
  code: number; // Custom status code
  message: string;
  data?: T;
}

/**
 * API Error class for custom status code errors
 */
export class ApiError extends Error {
  constructor(
    public code: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API response and check for custom status codes
 * Throws ApiError if response contains error status code
 * Returns data if successful
 */
export const handleApiResponse = <T = unknown>(
  response: AxiosResponse<ApiResponse<T>>
): T => {
  const { data } = response;

  // Check if response has custom status code
  if (data.code !== undefined) {
    // Check if it's a success code
    if (isSuccessCode(data.code)) {
      return data.data as T;
    }

    // It's an error code - throw ApiError
    const errorMessage = data.message || getStatusMessage(data.code);
    throw new ApiError(data.code, errorMessage, data.data);
  }

  // If no custom status code, return data as-is
  // This handles standard API responses
  return (data.data || data) as T;
};

/**
 * Check if error is an ApiError with specific status code
 */
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

/**
 * Get error message from any error type
 * Handles ApiError, axios errors, and standard errors
 */
export const getErrorMessage = (error: unknown): string => {
  // Check if it's our custom ApiError
  if (isApiError(error)) {
    return error.message;
  }

  // Type guard for axios error
  const axiosError = error as {
    response?: { data?: { code?: number; message?: string } };
    message?: string;
  };

  // Check if it's an axios error with custom status code in response
  if (axiosError?.response?.data?.code) {
    const code = axiosError.response.data.code;
    // Use our custom message for better UX (more specific and helpful)
    return getStatusMessage(code);
  }

  // Check if it's a network error
  if (axiosError?.message === 'Network Error' || !axiosError?.response) {
    return 'Network error. Please check your internet connection.';
  }

  // Check if it's an axios error with message
  if (axiosError?.response?.data?.message) {
    return axiosError.response.data.message;
  }

  // Fallback to generic error message
  return (
    axiosError?.message || 'An unexpected error occurred. Please try again.'
  );
};

/**
 * Validate login response and extract user data
 */
export const validateLoginResponse = (data: ApiResponse) => {
  // Check if login was successful based on status code
  if (data.code === STATUS_CODES.LOGIN_SUCCESS) {
    return {
      success: true,
      user: data.data,
      token: (data.data as { token?: string })?.token,
    };
  }

  // Login failed - use our custom message for better UX
  throw new ApiError(
    data.code || STATUS_CODES.INVALID_LOGIN,
    getStatusMessage(data.code || STATUS_CODES.INVALID_LOGIN)
  );
};

/**
 * Safe API call wrapper that prevents Next.js error overlay
 * This wraps async API calls and handles errors silently
 */
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    // Log error without triggering Next.js overlay
    if (process.env.NODE_ENV === 'development') {
      console.log('API Error:', error);
    }
    return { data: null, error: getErrorMessage(error) };
  }
};
