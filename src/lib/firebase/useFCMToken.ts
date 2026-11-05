/**
 * React Hook for FCM Token - Simplified Version
 *
 * This hook manages FCM token retrieval and provides it to components.
 */

import { useState, useEffect, useRef } from 'react';
import { getFCMToken, initializeFirebase, isFirebaseConfigured } from './init';

/**
 * Hook to get FCM token
 *
 * @returns Object with FCM token, loading state, and error
 */
/**
 * Hook to get FCM token
 *
 * @returns Object with FCM token, loading state, error, and request function
 */
export function useFCMToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  // Function to retrieve token - can be called automatically or manually
  const retrieveToken = async (isManualRequest = false) => {
    try {
      if (isMountedRef.current) setIsLoading(true);
      if (isMountedRef.current) setError(null);

      // Check if Firebase is configured
      if (!isFirebaseConfigured()) {
        if (isMountedRef.current) setIsLoading(false);
        return null;
      }

      // Check if browser supports notifications
      if (typeof window === 'undefined' || !('Notification' in window)) {
        // console.warn('[FCM] Hook: ⚠️ Browser does not support notifications');
        if (isMountedRef.current) setIsLoading(false);
        return null;
      }

      // If permission is default and not a manual request, DO NOT attempt to get token
      // This prevents the "blocked" error in Safari/Firefox when requesting without user gesture
      if (Notification.permission === 'default' && !isManualRequest) {
        // console.log('[FCM] Hook: Permission is default, waiting for user gesture');
        if (isMountedRef.current) setIsLoading(false);
        return null;
      }

      // Initialize Firebase
      await initializeFirebase();

      // Get FCM token (this will trigger permission request if needed and allowed)
      const fcmToken = await getFCMToken();

      if (fcmToken && isMountedRef.current) {
        setToken(fcmToken);
      }

      return fcmToken;
    } catch (err) {
      // console.error('[FCM] Hook: ❌ Error:', err);
      const error =
        err instanceof Error ? err : new Error('Failed to get FCM token');
      if (isMountedRef.current) {
        setError(error);
        setToken(null);
      }
      return null;
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Auto-check on mount
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Only auto-fetch if we already have permission
      if (Notification.permission === 'granted') {
        retrieveToken(false);
      } else {
        // Otherwise just finish loading
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { token, isLoading, error, requestToken: () => retrieveToken(true) };
}
