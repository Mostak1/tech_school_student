'use client';
/**
 * React Hook for Foreground Notifications
 *
 * This hook sets up a listener for FCM messages when the app is open (foreground).
 * When a message is received, it displays a browser notification.
 */

import { useEffect } from 'react';
import {
  initializeFirebase,
  onForegroundMessage,
  isFirebaseConfigured,
  FirebaseMessagePayload,
} from './init';

/**
 * Hook to handle foreground notifications
 *
 * This hook automatically:
 * 1. Initializes Firebase messaging
 * 2. Listens for incoming messages while app is open
 * 3. Displays browser notifications for foreground messages
 * 4. Handles notification clicks to redirect users
 *
 * Usage: Call this hook once in your main layout/dashboard component
 */
export function useForegroundNotifications(
  onNotificationReceived?: (payload: FirebaseMessagePayload) => void
) {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Setup function
    async function setupForegroundNotifications() {
      try {
        if (!isFirebaseConfigured()) {
          return;
        }

        // Initialize Firebase first
        await initializeFirebase();
        // console.log('[FCM] Firebase initialized for foreground notifications');

        // Check if permission is granted
        if (Notification.permission !== 'granted') {
          // console.log(
          //   '[FCM] Notification permission not granted. Foreground notifications will not work.'
          // );
          return;
        }

        // Set up the message listener
        // This will be called whenever a message arrives while app is open
        // Store the unsubscribe function for cleanup
        const unsub = onForegroundMessage((payload: FirebaseMessagePayload) => {
          // Call the callback if provided
          if (onNotificationReceived) {
            onNotificationReceived(payload);
          }

          // Note: Notification display logic is now handled in PushNotification.jsx
          // via the callback and notificationHelper.ts to ensure it works
          // even if this specific listener doesn't fire (e.g. via SW postMessage)
        });

        // Store unsubscribe function if it exists
        if (unsub) {
          unsubscribe = unsub;
        }

        // console.log('[FCM] ✅ Foreground notification handler setup complete');
      } catch (error) {
        console.error(
          '[FCM] ❌ Error setting up foreground notifications:',
          error
        );
      }
    }

    // Run setup
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setupForegroundNotifications();
    } else {
      // console.warn(
      //   '[FCM] Browser does not support notifications - foreground notifications disabled'
      // );
    }

    // Cleanup function - properly unsubscribe from Firebase messaging
    return () => {
      if (unsubscribe) {
        // console.log('[FCM] Cleaning up foreground notification handler');
        unsubscribe(); // Call the unsubscribe function
        // console.log('[FCM] ✅ Foreground notification listener removed');
      }
    };
  }, [onNotificationReceived]); // Re-run if callback changes

  // This hook doesn't return anything
  // It just sets up the listener in the background
}
