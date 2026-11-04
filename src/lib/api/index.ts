/**
 * API Module Index
 *
 * This file exports all API modules organized by user roles.
 * This makes it easy to import role-specific APIs and prevents naming conflicts.
 */

// Export student API
export * from './student';

// Export teacher API (placeholder)
export * from './teacher';

// Export parent API (placeholder)
export * from './parent';

// Re-export student API as default for backward compatibility
export * from './student';
