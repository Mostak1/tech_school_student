/**
 * Student API Module Index
 *
 * This file exports student authentication functions and hooks for easy importing.
 * Focused only on login and logout functionality for simplicity.
 */

// Export student endpoints
export * from './endpoints';

// Export axios configuration
export { studentApi } from './axiosConfig';

// Export student API functions
export * from './functions';

// Export student TanStack Query hooks
export * from './queryHooks';

// Export status codes and utilities
export * from './statusCodes';
export * from './responseHandler';

// Export types for TypeScript support
export type {
  StudentLoginRequest,
  StudentLoginResponse,
  StudentChangePasswordRequest,
  StudentChangePasswordResponse,
  StudentProfileData,
  StudentProfileResponse,
} from './functions';
export type { ApiResponse, ApiError } from './responseHandler';
