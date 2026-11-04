/**
 * Axios Configuration for Student API
 *
 * This file configures axios with interceptors for better error handling
 * and automatic token management.
 */

import axios from 'axios';
import { Dispatch, AnyAction } from '@reduxjs/toolkit';
import { API_BASE_URL, STUDENT_AUTH_ENDPOINTS } from './endpoints';
import { ApiResponse, ApiError } from './responseHandler';
import { getStatusMessage, isSuccessCode } from './statusCodes';
import { toastUtils } from '@/components/lib/toast';

// Token and school code management for axios interceptors
let currentToken: string | null = null;
let currentSchoolCode: string | null = null;

// Store reference for dispatching logout action
// This will be set from the Redux store initialization
let storeDispatch: Dispatch<AnyAction> | null = null;

// Function to set the store dispatch
export const setStoreDispatch = (dispatch: Dispatch<AnyAction>) => {
  storeDispatch = dispatch;
};

// Deactivation message to check for
const DEACTIVATION_MESSAGE = 'Your account has been deactivated. Please contact the administrator for assistance.';

// Function to handle student deactivation
const handleStudentDeactivation = (message: string, isLoginRequest: boolean = false) => {
  // Check if the message indicates account deactivation
  if (message === DEACTIVATION_MESSAGE || message.toLowerCase().includes('deactivated') || message.toLowerCase().includes('inactive')) {
    // Clear tokens immediately
    clearAxiosToken();
    clearAxiosSchoolCode();
    
    // If this is a login request, we don't want to redirect to the inactive page
    // We just want to show the toast message and let the user stay on the login page
    if (isLoginRequest) {
      if (typeof window !== 'undefined') {
        // Ensure no leftover deactivation flag prevents future logins
        localStorage.removeItem('account_deactivated');
      }
      return true;
    }
    
    // Clear localStorage and set deactivation flag
    if (typeof window !== 'undefined') {
      localStorage.removeItem('student_auth_state');
      // Set deactivation flag to block access to all pages
      localStorage.setItem('account_deactivated', 'true');
      localStorage.setItem('deactivation_message', message);
    }
    
    // Dispatch logout action if store is available
    if (storeDispatch) {
      // Import the logout action dynamically to avoid circular dependency
      import('@/components/store/slices/studentAuthSlice').then(({ logout }) => {
        storeDispatch?.(logout());
      });
    }
    
    // Show deactivation message to user
    toastUtils.error(message);
    
    // Redirect to inactive page immediately
    if (typeof window !== 'undefined') {
      const encodedMessage = encodeURIComponent(message);
      window.location.href = `/student/auth/inactive?message=${encodedMessage}`;
    }
    
    return true; // Indicates deactivation was handled
  }
  return false; // Not a deactivation message
};

/**
 * Handle student logout when API returns 401 Unauthenticated
 */
const handleUnauthenticated = (message: string) => {
  // Check if the message indicates unauthenticated session
  // This message is returned by the API when the token is invalid or expired
  const isUnauthenticated =
    message === 'Unauthenticated.' ||
    message.toLowerCase().includes('unauthenticated') ||
    message.toLowerCase().includes('token_expired') ||
    message.toLowerCase().includes('token_invalid') ||
    message.toLowerCase().includes('unauthorized');

  if (isUnauthenticated) {
    // Clear tokens immediately
    clearAxiosToken();
    clearAxiosSchoolCode();

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('student_auth_state');
    }

    // Dispatch logout action if store is available to sync Redux state
    if (storeDispatch) {
      // Import the logout action dynamically to avoid circular dependency
      import('@/components/store/slices/studentAuthSlice').then(({ logout }) => {
        storeDispatch?.(logout());
      });
    }

    // Show error message to user
    toastUtils.error(message);

    // Redirect to login page immediately
    if (typeof window !== 'undefined') {
      // Small delay to let the toast be seen (optional, but window.location.href is immediate)
      window.location.href = '/student/auth/login';
    }

    return true; // Indicates unauthenticated was handled
  }
  return false; // Not an unauthenticated message
};

// Function to update token (called from Redux actions)
export const updateAxiosToken = (token: string | null) => {
  currentToken = token;
};

// Function to update school code (called from Redux actions)
export const updateAxiosSchoolCode = (schoolCode: string | null) => {
  currentSchoolCode = schoolCode;
};

// Function to clear token
export const clearAxiosToken = () => {
  currentToken = null;
};

// Function to clear school code
export const clearAxiosSchoolCode = () => {
  currentSchoolCode = null;
};

// Create axios instance with base configuration
export const studentApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  // Note: withCredentials set to false for static export to avoid CORS preflight issues
  // The external API uses token-based auth, not cookies
  withCredentials: false,
  headers: {
    Accept: 'application/json, text/plain, */*',
  },
});

// Request interceptor - add auth token and school code to requests
studentApi.interceptors.request.use(
  (config) => {
    // Add auth token from Redux state (via currentToken)
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }

    // Add school code header for all requests after login
    // This is required by the API for authenticated requests
    if (currentSchoolCode) {
      config.headers['school-code'] = currentSchoolCode;
    }

    return config;
  },
  (error) => {
    // Request interceptor error - will be handled by response interceptor
    return Promise.reject(error);
  }
);

// Response interceptor - handle custom status codes and common errors
studentApi.interceptors.response.use(
  (response) => {
    // Check if response has custom API status code or error flag
    const apiResponse = response.data as ApiResponse & { error?: boolean };

    // Check if response indicates an error (either by code or error flag)
    if (apiResponse.code !== undefined && !isSuccessCode(apiResponse.code)) {
      // Use API's message if available (it's more specific), otherwise use status code message
      // This ensures we show specific messages like "Exam not started yet" instead of generic ones
      const errorMessage =
        apiResponse.message || getStatusMessage(apiResponse.code);
      
      const isLoginRequest = response.config.url?.includes(STUDENT_AUTH_ENDPOINTS.LOGIN) || false;

      // Handle unauthenticated session (401)
      if (apiResponse.code === 401 && handleUnauthenticated(errorMessage)) {
        return Promise.reject(
          new ApiError(apiResponse.code, errorMessage, apiResponse.data)
        );
      }
      
      // Check for deactivation before rejecting
      if (handleStudentDeactivation(errorMessage, isLoginRequest)) {
        // Deactivation handled, still reject the promise to prevent further processing
        return Promise.reject(
          new ApiError(apiResponse.code, errorMessage, apiResponse.data)
        );
      }
      
      // Return rejected promise instead of throwing to prevent Next.js error overlay
      return Promise.reject(
        new ApiError(apiResponse.code, errorMessage, apiResponse.data)
      );
    }

    // Also check for error flag in response body (some APIs return error: true)
    if (apiResponse.error === true && apiResponse.message) {
      const isLoginRequest = response.config.url?.includes(STUDENT_AUTH_ENDPOINTS.LOGIN) || false;
      
      // Handle unauthenticated session
      if (apiResponse.code === 401 && handleUnauthenticated(apiResponse.message)) {
        const errorCode = apiResponse.code || 103;
        return Promise.reject(
          new ApiError(errorCode, apiResponse.message, apiResponse.data)
        );
      }

      // Check for deactivation before rejecting
      if (handleStudentDeactivation(apiResponse.message, isLoginRequest)) {
        // Deactivation handled, still reject the promise to prevent further processing
        const errorCode = apiResponse.code || 103;
        return Promise.reject(
          new ApiError(errorCode, apiResponse.message, apiResponse.data)
        );
      }
      
      // Use the API's error message directly
      const errorCode = apiResponse.code || 103; // Default to 103 if no code provided
      return Promise.reject(
        new ApiError(errorCode, apiResponse.message, apiResponse.data)
      );
    }

    // Return successful responses
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      // Check for custom status code in error response
      if (data?.code !== undefined) {
        // Use API's message if available (it's more specific), otherwise use status code message
        // This ensures we show specific messages like "Exam not started yet" instead of generic ones
        const errorMessage = data.message || getStatusMessage(data.code);
        const isLoginRequest = error.config?.url?.includes(STUDENT_AUTH_ENDPOINTS.LOGIN) || false;
        
        // Handle unauthenticated session (401)
        if (data.code === 401 && handleUnauthenticated(errorMessage)) {
          return Promise.reject(new ApiError(data.code, errorMessage, data.data));
        }

        // Check for deactivation before rejecting
        if (handleStudentDeactivation(errorMessage, isLoginRequest)) {
          return Promise.reject(new ApiError(data.code, errorMessage, data.data));
        }
        
        return Promise.reject(new ApiError(data.code, errorMessage, data.data));
      }

      // Also check for error flag in response body
      if (data?.error === true && data?.message) {
        const isLoginRequest = error.config?.url?.includes(STUDENT_AUTH_ENDPOINTS.LOGIN) || false;

        // Handle unauthenticated session
        if (data.code === 401 && handleUnauthenticated(data.message)) {
          const errorCode = data.code || 103;
          return Promise.reject(new ApiError(errorCode, data.message, data.data));
        }

        // Check for deactivation before rejecting
        if (handleStudentDeactivation(data.message, isLoginRequest)) {
          const errorCode = data.code || 103;
          return Promise.reject(new ApiError(errorCode, data.message, data.data));
        }
        
        // Use the API's error message directly
        const errorCode = data.code || 103; // Default to 103 if no code provided
        return Promise.reject(new ApiError(errorCode, data.message, data.data));
      }

      // Handle HTTP status codes
      switch (status) {
        case 401:
          // Unauthorized HTTP status - clear auth and redirect to login
          // We use the generic message if none provided in body
          handleUnauthenticated(data?.message || 'Unauthenticated.');
          break;

        case 403:
          // Forbidden - user doesn't have permission
          // Error toast will be handled by the component
          break;

        case 404:
          // Not found
          // Error toast will be handled by the component
          break;

        case 500:
          // Server error
          // Error toast will be handled by the component
          break;

        default:
        // Error toast will be handled by the component
      }
    } else if (error.request) {
      // Network error - no response received
      // Error toast will be handled by the component
    } else {
      // Request setup error
      // Error toast will be handled by the component
    }

    return Promise.reject(error);
  }
);

export default studentApi;
