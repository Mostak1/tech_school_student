/**
 * Firebase Cloud Messaging Service Worker - Simplified Version
 *
 * This service worker handles push notifications from Firebase.
 * It keeps things simple to check if messages are received.
 *
 * Version: 2.3 - Fixed duplicate notifications
 * - Use message ID as tag to prevent duplicates
 * - Coordinate with foreground handler
 * - Added renotify: false to prevent re-alerting
 */

// Service Worker Version
// const SW_VERSION = '2.3';

// Import Firebase scripts from CDN
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js'
);

// Firebase configuration
const firebaseConfig = {
  apiKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxx ",
  authDomain: "xxxxxxxxxxxxxxxxxxxxxxxxxxx ",
  projectId: "xxxxxxxxxxxxxxxxxxxxxxxxxxx ",
  storageBucket: "xxxxxxxxxxxxxxxxxxxxxxxxxxx ",
  messagingSenderId: "xxxxxxxxxxxxxxxxxxxxxxxxxxx ",
  appId: "xxxxxxxxxxxxxxxxxxxxxxxxxxx ",
  measurementId: "xxxxxxxxxxxxxxxxxxxxxxxxxxx ",
};

// console.log('[SW] Service worker loaded - Version:', SW_VERSION);
// console.log('[SW] Firebase config:', firebaseConfig);

// Initialize Firebase
try {
  const isConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    !firebaseConfig.projectId.includes('xxx')
  );
  if (isConfigured) {
    firebase.initializeApp(firebaseConfig);
    // console.log('[SW] ✅ Firebase initialized');
  }
} catch (error) {
  console.error('[SW] ❌ Error initializing Firebase:', error);
}

// Get Firebase Messaging instance
// We still instantiate messaging so Firebase keeps binding the SW to FCM.
// const messaging = firebase.messaging();
// self.__firebaseMessagingInstance = messaging;
// console.log('[SW] ✅ Messaging instance created');

/* -----------------------------------------------------
   Service Worker Lifecycle Events
   CRITICAL: These ensure immediate activation in production
------------------------------------------------------ */
// Force service worker to activate immediately (skip waiting)
self.addEventListener('install', function () {
  // Skip waiting means the new service worker will activate immediately
  // instead of waiting for all tabs to close
  self.skipWaiting();
});

// Claim all clients immediately when service worker activates
self.addEventListener('activate', function (event) {
  // clients.claim() makes the service worker take control of all pages
  // immediately, even if they were loaded before the service worker activated
  event.waitUntil(self.clients.claim());
});

/* -----------------------------------------------------
   Helper: Build redirect URL based on notification type
   Handles all backend notification types
   Backend now only sends 'type' field
------------------------------------------------------ */

/* -----------------------------------------------------
   Helper: Build student redirect URL by notification type
   Matches src/lib/firebase/notificationRedirect.ts
------------------------------------------------------ */
const getNotificationRedirectUrl = (notificationData = {}) => {
  const type = notificationData?.type?.toLowerCase() || '';
  const extraType = notificationData?.exam_type?.toLowerCase() || '';
  // console.log('[SW] Notification data:', notificationData);
  // console.log('[SW] Notification type:', type);
  // console.log('[SW] Extra type:', extraType);
  // Announcement ───────────────────────────────────────────────
  if (type.includes('announcement') ||
      type === 'announcement created' ||
      type === 'announcement updated') {
    return '/student/dashboard';
  }

  // Lesson topic ───────────────────────────────────────────────
  if (type === 'lesson topic created' ||
      type === 'lesson topic updated' ||
      type === 'lesson' ||
      type === 'topic') {
    const sid = data.subject_id;
    if (sid && Number.isInteger(Number(sid))) {
      return `/student/subjects/detail?id=${sid}`;
    }
    return '/student/subjects';
  }

  if (type === 'assignment') {
    const assignmentId = notificationData.assignment_id;
    const classSubjectId = notificationData.class_subject_id;
    if (assignmentId && classSubjectId) {
      return `/student/assignments?assignment_id=${assignmentId}&class_subject_id=${classSubjectId}`;
    }
    return '/student/assignments';
  }
    if (type === 'message') {
    const receiverId = notificationData.receiver_id;
    if (receiverId) {
      return `/student/chats?receiver_id=${receiverId}`;
    }
    return '/student/chats';
  }

  if (type === 'payment' || type === 'fees_paid' || type === 'fee-reminder') {
    return '/student/transactions';
  }

  if (type === 'message') {
    const receiverId = notificationData.receiver_id;
    if (receiverId) {
      return `/student/chats?receiver_id=${receiverId}`;
    }
    return '/student/chats';
  }

  if (type === 'payment' || type === 'fees_paid' || type === 'fee-reminder') {
    return '/student/transactions';
  }

  if (type === 'lesson') {
    const subjectId = notificationData.subject_id;
    if (subjectId) {
      return `/student/subjects/detail?id=${subjectId}`;
    }
    return '/student/dashboard';
  }

  // if (type === 'topic') {
  //   const subjectId = notificationData.subject_id;
  //   const lessonId = notificationData.lesson_id;
  //   if (subjectId && lessonId) {
  //     return `/student/subjects/lesson?subjectId=${subjectId}&lessonId=${lessonId}`;
  //   }
  //   if (subjectId) {
  //     return `/student/subjects/detail?id=${subjectId}`;
  //   }
  //   return '/student/subjects';
  // }

  if (type === 'exam') {
    const examId = notificationData.exam_id;
    // console.log('[SW] Exam ID:', examId);
    // console.log('[SW] Extra type:', extraType);
    // console.log(typeof extraType);

    if (extraType === 'online' && examId) {
      // console.log('[SW] Returning online exam URL with tab parameter');
      return `/student/exams?tab=online&exam_id=${examId}`;
    }

    if (extraType === 'offline' && examId) {
      // console.log('[SW] Returning offline exam URL');
      return `/student/exams/offline/detail?id=${examId}`;
    }

    // Fallback to general exams page if exam_type or exam_id is missing
    // console.log('[SW] Falling back to general exams page');
    return '/student/exams';
  }

  if (type === 'exam result' || type === 'result') {
    const resultId = notificationData.result_id || notificationData.exam_id;
    if (resultId) {
      return `/student/result?result_id=${resultId}`;
    }
    return '/student/result';
  }

  if (type === 'exam_timetable_created') {
    const examId = notificationData.exam_id;
    if (examId) {
      return `/student/exams?exam_id=${examId}`;
    }
    return '/student/exams';
  }

  if (type === 'attendance') {
    return '/student/attendance';
  }

  if (type === 'diary') {
    return '/student/diary';
  }

  if (type === 'leave') {
    return '/student/notifications';
  }

  if (type === 'class section') {
    const subjectId = notificationData.subject_id;
    if (subjectId) {
      return `/student/subjects/detail?id=${subjectId}`;
    }
    return '/student/subjects';
  }

  if (type === 'transport' || type === 'transportation') {
    return '/student/transportation';
  }

  if (type === 'notification' || type === 'general' || type === 'custom') {
    return '/student/notifications';
  }

  return '/student/notifications';
};

/* -----------------------------------------------------
   FCM Background Notification Handler
------------------------------------------------------ */
self.addEventListener('push', function (event) {
  if (!event.data) {
    return;
  }

  try {
    const payload = event.data.json();
    const data = payload.data || {};

    const title = payload.notification?.title || data.title || 'Notification';
    const body = payload.notification?.body || data.body || '';
    const icon = data.icon || data.image || '/favicon.ico';

    // Build final redirect URL
    const redirectUrl = getNotificationRedirectUrl(data);
    // console.log('[SW] Redirect URL:', redirectUrl);

    // Calculate absolute URL that will be used on click
    const origin = self.location.origin;
    let absoluteRedirectUrl = redirectUrl;
    if (
      redirectUrl.startsWith('http://') ||
      redirectUrl.startsWith('https://')
    ) {
      absoluteRedirectUrl = redirectUrl;
    } else {
      const cleanUrl = redirectUrl.startsWith('/')
        ? redirectUrl
        : '/' + redirectUrl;
      absoluteRedirectUrl = origin + cleanUrl;
    }

    // console.log('[SW] Absolute Redirect URL:', absoluteRedirectUrl);
    // console.log('[SW] Origin:', origin);

    const options = {
      body,
      icon,
      data: {
        url: redirectUrl,
        absoluteUrl: absoluteRedirectUrl,
        originalData: data,
      },
      requireInteraction: false,
    };

    // Check if the app is currently focused
    event.waitUntil(
      clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then((windowClients) => {
          // Check if there is a focused window
          for (const client of windowClients) {
            if (client.focused) {
              // App is in foreground!

              // Send message to client to update UI (chat, badges, etc.)
              client.postMessage(payload);

              // Check if we are on the chat page
              // If so, suppress the notification
              if (client.url && client.url.includes('/chats')) {
                // console.log('[SW] On chat page, suppressing notification');
                return;
              }

              // If not on chat page, we fall through to show notification
              // console.log('[SW] Focused but not on chat page, showing notification');
              break; // Break loop to show notification
            }
          }

          // Show notification (if no focused client on chat page)
          return self.registration.showNotification(title, options);
        })
    );
  } catch (e) {
    console.error('🔔 [SW] Error processing push notification:', e);
  }
});

/* -----------------------------------------------------
   Notification Click → Focus existing tab or open new
------------------------------------------------------ */
self.addEventListener('notificationclick', function (event) {
  // console.log('[SW] Notification clicked');
  const notificationData = event.notification.data || {};
  // console.log('[SW] Notification data:', notificationData);

  let url = notificationData.url || '/';
  const originalData = notificationData.originalData || {};

  // console.log('[SW] Initial URL from notification data:', url);
  // console.log('[SW] Original data:', originalData);

  // If URL is missing or just "/", recalculate from original data
  // This handles cases where the URL wasn't stored correctly
  if (!url || url === '/' || url === '') {
    // console.log('[SW] URL is missing or empty, recalculating from original data');
    if (originalData && Object.keys(originalData).length > 0) {
      url = getNotificationRedirectUrl(originalData);
      // console.log('[SW] Recalculated URL:', url);
    } else {
      url = '/';
      // console.log('[SW] No original data, using default URL:', url);
    }
  }

  event.notification.close();

  // Build full absolute URL (required for openWindow)
  const origin = self.location.origin;

  // Check if URL is already absolute
  let fullUrl = url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    fullUrl = url;
  } else {
    // Build absolute URL from relative path
    const cleanUrl = url.startsWith('/') ? url : '/' + url;
    fullUrl = origin + cleanUrl;
  }

  // Validate URL format
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    const cleanUrl = url.startsWith('/') ? url : '/' + url;
    fullUrl = origin + cleanUrl;
  }

  // console.log('[SW] Final full URL for navigation:', fullUrl);
  // console.log('[SW] Origin:', origin);

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        // Check for existing tabs from this origin
        let foundExistingTab = false;
        for (const client of windowClients) {
          if (client.url && client.url.startsWith(origin)) {
            foundExistingTab = true;
            // console.log('[SW] Found existing tab:', client.url);
            // console.log('[SW] Navigating to:', fullUrl);
            // console.log('[SW] Relative URL:', url);

            // Focus the existing tab
            if (client.focus) {
              client.focus();
            }

            // Send navigation message to the tab with RELATIVE URL for smooth navigation
            client.postMessage({
              action: 'navigate',
              url: url, // Send relative URL, not absolute
              fullUrl: fullUrl, // Also send full URL as backup
            });

            // Also send with type format for PushNotification component
            client.postMessage({
              type: 'NAVIGATE',
              url: url, // Send relative URL, not absolute
              fullUrl: fullUrl, // Also send full URL as backup
            });

            // console.log('[SW] Posted navigation message to client');
            return Promise.resolve();
          }
        }

        // No existing tab found - open new window
        if (!foundExistingTab) {
          // console.log(
          //   '[SW] No existing tab found, opening new window with URL:',
          //   fullUrl
          // );
          // Use clients.openWindow - this MUST be called within user gesture
          // and MUST return a promise that resolves to the new window
          const openWindowPromise = clients.openWindow(fullUrl);

          return openWindowPromise
            .then((newClient) => {
              if (newClient) {
                return newClient;
              } else {
                // Try one more time as fallback
                return clients.openWindow(fullUrl).then((retryClient) => {
                  return retryClient;
                });
              }
            })
            .catch((error) => {
              console.error('🔔 [SW] Error opening new window:', error);
              // Try one final time
              try {
                const finalAttempt = clients.openWindow(fullUrl);
                if (finalAttempt && finalAttempt.then) {
                  return finalAttempt.then((finalClient) => {
                    return finalClient;
                  });
                }
                return finalAttempt;
              } catch (e) {
                console.error('🔔 [SW] Final attempt failed:', e);
                throw e;
              }
            });
        }
      })
      .catch((error) => {
        console.error('🔔 [SW] Error in notification click handler:', error);
        // Last resort: try to open window directly (may not work due to context)
        try {
          if (clients && clients.openWindow) {
            const result = clients.openWindow(fullUrl);
            if (result && result.then) {
              return result.then((client) => {
                return client;
              });
            }
            return result;
          }
        } catch (e) {
          console.error('🔔 [SW] Failed to open window in catch block:', e);
        }
      })
  );
});
