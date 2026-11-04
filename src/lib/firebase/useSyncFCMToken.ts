/**
 * React Hook for Monitoring FCM Token Changes
 *
 * This hook monitors the FCM token and detects when it changes.
 * FCM tokens can change when:
 * - Service worker is re-registered
 * - User clears browser data
 * - Token expires or is refreshed by Firebase
 * - Browser/app is updated
 *
 * Since there's no separate update-token API endpoint, this hook:
 * - Monitors token changes
 * - Stores the latest token locally
 * - Logs warnings when token changes while logged in
 * - The new token will be sent on next login
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { initializeFirebase, getFCMToken } from './init';
import { RootState } from '@/components/store';

// Storage key for last known FCM token
const FCM_TOKEN_STORAGE_KEY = 'eschool_fcm_token';

/**
 * Hook to monitor FCM token changes
 *
 * Features:
 * - Automatically checks for token changes
 * - Stores latest token in localStorage
 * - Logs warnings when token changes while logged in
 * - Only runs when user is authenticated
 * - Prevents duplicate checks
 *
 * Note: Since there's no separate update-token API endpoint,
 * the new token will be sent to backend on next login.
 *
 * Usage: Call this hook once in your main dashboard layout
 */
export function useSyncFCMToken() {
  // Track if check is in progress to prevent duplicate calls
  const isCheckingRef = useRef(false);
  // Track if initial check is complete
  const hasInitialCheckRef = useRef(false);
  // Track if we've already shown warning for this session
  const hasShownWarningRef = useRef(false);

  // Get authentication state from Redux
  const { isAuthenticated, token: authToken } = useSelector(
    (state: RootState) => state.studentAuth
  );

  useEffect(() => {
    // Only monitor if user is authenticated
    if (!isAuthenticated || !authToken) {
      // console.log(
      //   '[FCM Monitor] User not authenticated, skipping FCM monitoring'
      // );
      return;
    }

    // Don't check if already in progress
    if (isCheckingRef.current) {
      // console.log('[FCM Monitor] Check already in progress, skipping');
      return;
    }

    // Function to check FCM token
    async function checkFCMToken() {
      try {
        isCheckingRef.current = true;
        // console.log('[FCM Monitor] Checking FCM token...');

        // Initialize Firebase if not already done
        await initializeFirebase();

        // Check if notifications are supported and permission is granted
        if (!('Notification' in window)) {
          // console.log(
          //   '[FCM Monitor] Notifications not supported in this browser'
          // );
          return;
        }

        if (Notification.permission !== 'granted') {
          // console.log('[FCM Monitor] Notification permission not granted');
          return;
        }

        // Get current FCM token from Firebase
        const currentToken = await getFCMToken();

        if (!currentToken) {
          // console.log('[FCM Monitor] No FCM token available');
          return;
        }

        // console.log(
        //   '[FCM Monitor] Current token:',
        //   currentToken.substring(0, 20) + '...'
        // );

        // Get stored token from localStorage (token sent during login)
        const storedToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
        // console.log(
        //   '[FCM Monitor] Token sent at login:',
        //   storedToken ? storedToken.substring(0, 20) + '...' : 'None'
        // );

        // Check if token has changed
        const hasTokenChanged = storedToken && currentToken !== storedToken;

        if (!storedToken) {
          // First time - store the current token
          // console.log('[FCM Monitor] Storing initial FCM token');
          localStorage.setItem(FCM_TOKEN_STORAGE_KEY, currentToken);
          hasInitialCheckRef.current = true;
        } else if (hasTokenChanged) {
          // Token changed while user is logged in!
          // console.warn(
          //   '⚠️ ═══════════════════════════════════════════════════════'
          // );
          // console.warn('[FCM Monitor] ⚠️ FCM TOKEN HAS CHANGED!');
          // console.warn(
          //   '[FCM Monitor] Old token:',
          //   storedToken.substring(0, 30) + '...'
          // );
          // console.warn(
          //   '[FCM Monitor] New token:',
          //   currentToken.substring(0, 30) + '...'
          // );
          // console.warn('[FCM Monitor]');
          // console.warn('[FCM Monitor] ⚠️ IMPORTANT: Backend has OLD token!');
          // console.warn(
          //   '[FCM Monitor] Notifications may NOT work until next login.'
          // );
          // console.warn('[FCM Monitor]');
          // console.warn(
          //   '[FCM Monitor] 💡 SOLUTION: User needs to logout and login again'
          // );
          // console.warn(
          //   '[FCM Monitor] The new token will be sent during login.'
          // );
          // console.warn(
          //   '⚠️ ═══════════════════════════════════════════════════════'
          // );

          // Store the new token for future comparison
          localStorage.setItem(FCM_TOKEN_STORAGE_KEY, currentToken);

          // Show user-friendly warning once per session
          if (!hasShownWarningRef.current) {
            hasShownWarningRef.current = true;
            // You could show a toast notification here
            // console.warn(
            //   '[FCM Monitor] 💡 TIP: If notifications stop working, please logout and login again.'
            // );
          }
        } else {
          // Token unchanged
          // console.log('[FCM Monitor] ✅ Token unchanged, all good!');
          hasInitialCheckRef.current = true;
        }
      } catch (error) {
        console.error('[FCM Monitor] ❌ Error checking token:', error);
      } finally {
        isCheckingRef.current = false;
      }
    }

    // Run initial check after a short delay
    // This gives time for authentication to fully settle
    const timeoutId = setTimeout(() => {
      checkFCMToken();
    }, 2000); // 2 second delay

    // Set up periodic check every 3 minutes
    // This catches any token refreshes that happen during the session
    const intervalId = setInterval(() => {
      if (!isCheckingRef.current) {
        // console.log('[FCM Monitor] Periodic token check...');
        checkFCMToken();
      }
    }, 3 * 60 * 1000); // 3 minutes

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isAuthenticated, authToken]); // Re-run when auth state changes

  // This hook doesn't return anything
  // It just runs in the background to monitor token changes
}

/**
 * Clear stored FCM token
 *
 * Call this function when user logs out to clear the stored token.
 * This ensures a fresh token check on next login.
 */
export function clearStoredFCMToken() {
  localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
  // console.log('[FCM Sync] Stored token cleared');
}
