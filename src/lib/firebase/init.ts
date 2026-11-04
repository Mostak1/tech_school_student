/**
 * Firebase Initialization - Simplified Version (Using Compat SDK)
 *
 * This module handles Firebase initialization and FCM token retrieval.
 * Uses compat SDK to match the service worker implementation.
 */

// Use compat SDK to match service worker
// This ensures consistent token generation
declare const firebase: {
  apps: unknown[];
  initializeApp: (config: unknown) => unknown;
  messaging: () => {
    getToken: (options: { vapidKey: string }) => Promise<string>;
    onMessage: (callback: (payload: unknown) => void) => void;
  };
};

/**
 * Firebase configuration
 * Using the same config as the service worker
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * VAPID key for web push notifications
 * This key is used to identify your app to Firebase
 */
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Firebase instances
let messaging: ReturnType<typeof firebase.messaging> | null = null;
let isInitialized = false;

/**
 * Load Firebase compat SDK scripts
 */
function loadFirebaseScripts(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof firebase !== 'undefined') {
      resolve();
      return;
    }

    // Load Firebase app compat
    const appScript = document.createElement('script');
    appScript.src =
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
    appScript.async = true;

    appScript.onload = () => {
      // Load Firebase messaging compat
      const messagingScript = document.createElement('script');
      messagingScript.src =
        'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js';
      messagingScript.async = true;

      messagingScript.onload = () => {
        // console.log('[FCM] ✅ Firebase scripts loaded');
        resolve();
      };

      messagingScript.onerror = () => {
        reject(new Error('Failed to load Firebase messaging script'));
      };

      document.head.appendChild(messagingScript);
    };

    appScript.onerror = () => {
      reject(new Error('Failed to load Firebase app script'));
    };

    document.head.appendChild(appScript);
  });
}

/**
 * Initialize Firebase app
 */
export async function initializeFirebase(): Promise<void> {
  // console.log('[FCM] Initializing Firebase...');

  // Return if already initialized
  if (isInitialized) {
    // console.log('[FCM] Firebase already initialized');
    return;
  }

  try {
    // Load Firebase scripts first
    await loadFirebaseScripts();

    // Check if Firebase app already exists
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      //  console.log('[FCM] ✅ Firebase app initialized');
    } else {
      // console.log('[FCM] ✅ Using existing Firebase app');
    }

    // Register service worker and initialize messaging
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        // Register the service worker
        // console.log('[FCM] Registering service worker...');
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        // console.log('[FCM] ✅ Service worker registered');

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        // console.log('[FCM] ✅ Service worker ready');

        // Initialize Firebase Messaging
        messaging = firebase.messaging();
        //  console.log('[FCM] ✅ Firebase Messaging initialized');

        isInitialized = true;
      } catch (error) {
        console.error('[FCM] ❌ Error setting up service worker:', error);
      }
    }
  } catch (error) {
    // console.error('[FCM] ❌ Error initializing Firebase:', error);
    throw error;
  }
}

/**
 * Get FCM token for push notifications
 *
 * @returns FCM token string, or null if unavailable
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    // console.log('[FCM] Getting FCM token...');

    // Initialize Firebase if not already done
    if (!isInitialized) {
      await initializeFirebase();
    }

    // Check if messaging is available
    if (!messaging) {
      // console.warn('[FCM] ⚠️ Messaging not available');
      return null;
    }

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      // console.warn('[FCM] ⚠️ Browser does not support notifications');
      return null;
    }

    // Check current permission
    let permission = Notification.permission;
    // console.log('[FCM] Current permission:', permission);

    // Request permission if not yet granted
    // Note: Some browsers block automatic permission requests
    // The user must interact with the page first
    if (permission === 'default') {
      // console.log('[FCM] Requesting notification permission...');
      try {
        permission = await Notification.requestPermission();
        // console.log('[FCM] Permission result:', permission);
      } catch (error) {
        console.error('[FCM] Error requesting permission:', error);
        return null;
      }
    }

    // Check if permission was denied
    if (permission === 'denied') {
      // console.warn(
      //   '[FCM] ⚠️ Notification permission denied. Push notifications will not work.'
      // );
      return null;
    }

    // Check if permission was granted
    if (permission !== 'granted') {
      //  console.warn(
      //   '[FCM] ⚠️ Notification permission not granted (still default). User needs to allow notifications in browser settings or when prompted. Login will work without FCM token.'
      // );
      return null;
    }

    // Check if VAPID key is available
    if (!VAPID_KEY) {
      console.error('[FCM] ❌ VAPID key is not configured');
      return null;
    }

    // Get FCM token
    // console.log('[FCM] Getting token with VAPID key...');
    const token = await messaging.getToken({ vapidKey: VAPID_KEY });

    if (token) {
      // console.log('[FCM] ✅ Token retrieved successfully');
      // console.log('[FCM] Token:', token);
      return token;
    } else {
      // console.warn('[FCM] ⚠️ No token available');
      return null;
    }
  } catch (error) {
    console.error('[FCM] ❌ Error getting FCM token:', error);
    return null;
  }
}

/**
 * Firebase message payload type
 */
export interface FirebaseMessagePayload {
  notification?: {
    title?: string;
    body?: string;
    image?: string;
  };
  data?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Listen for foreground messages (when app is open)
 *
 * @param callback - Function to call when a message is received
 * @returns Unsubscribe function to stop listening
 */
export function onForegroundMessage(
  callback: (payload: FirebaseMessagePayload) => void
): (() => void) | void {
  if (!messaging) {
    // console.warn('[FCM] ⚠️ Messaging not available for foreground messages');
    return;
  }

  // onMessage returns an unsubscribe function
  const unsubscribe = messaging.onMessage((payload) => {
    // console.log('[FCM] 📩 Foreground message received');
    // console.log('[FCM] Payload:', payload);
    callback(payload as FirebaseMessagePayload);
  });

  // Return the unsubscribe function
  return unsubscribe;
}

/**
 * Get Messaging instance
 */
export function getMessagingInstance(): typeof messaging {
  return messaging;
}
