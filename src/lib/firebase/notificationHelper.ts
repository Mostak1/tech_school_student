import { FirebaseMessagePayload } from './init';

/**
 * Show a browser notification if appropriate (e.g. not on chat page)
 */
export const showNotificationIfNeeded = (
  payload: FirebaseMessagePayload,
  logoUrl?: string
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  // Check if we are on the chat page
  const isChatPage = window.location.pathname.includes('/chats');
  // console.log(
  //   '[NotificationHelper] isChatPage:',
  //   isChatPage,
  //   'Path:',
  //   window.location.pathname
  // );

  // If we are on the chat page, we assume the user sees the message (or it updates automatically)
  // If we are NOT on the chat page, we must show the notification because the Service Worker suppresses it when focused
  if (!isChatPage) {
    const data = payload.data || {};
    const notificationData = payload.notification || {};

    const title = notificationData.title || data.title || 'New Notification';

    const body = notificationData.body || data.body || 'You have a new message';

    const icon =
      notificationData.image ||
      data.icon ||
      logoUrl ||
      '/assets/images/common/logo.png';

    // Generate unique tag from message ID to prevent duplicates
    const notificationTag =
      (payload as { messageId?: string }).messageId || data.type || 'general';

    // Get redirect URL
    const fcmOptions = (payload as { fcmOptions?: { link?: string } })
      .fcmOptions;
    const redirectUrl =
      fcmOptions?.link || data.redirect_url || '/student/notifications';

    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge: logoUrl || '/assets/images/common/logo.png',
        tag: notificationTag,
        requireInteraction: false,
        silent: false,
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
};
