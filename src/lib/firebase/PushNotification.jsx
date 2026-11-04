'use client';

import React from 'react';
import { useForegroundNotifications } from '@/lib/firebase/useForegroundNotifications';
import { useSyncFCMToken } from '@/lib/firebase/useSyncFCMToken';
import ServiceWorkerNavigationListener from '@/lib/firebase/ServiceWorkerNavigationListener';
import {
  NotificationProvider,
  useNotification,
} from '@/lib/firebase/NotificationContext';
import { useQueryClient } from '@tanstack/react-query';
import { useGetSchoolSettings } from '@/lib/api/student/queryHooks';
import { showNotificationIfNeeded } from './notificationHelper';

/**
 * Inner component to use the hook inside the provider
 */

const PushNotificationContent = ({ children, onNotificationReceived }) => {
  const { setLastNotification } = useNotification();
  const queryClient = useQueryClient();
  const { data: settingsData } = useGetSchoolSettings();
  const logoUrl = settingsData?.data?.settings?.favicon;

  const handleNotification = React.useCallback(
    (payload) => {
      // Check if this is a navigation message (from clicked notification)
      // Navigation messages should NOT trigger a new notification
      const isNavigationMessage =
        payload.action === 'navigate' || payload.type === 'NAVIGATE';

      // If it's a navigation message, skip notification display
      if (isNavigationMessage) {
        // console.log('[PushNotification] Navigation message received, skipping notification display');
        return;
      }

      // Update the context
      setLastNotification(payload);

      // Show notification if needed (e.g. not on chat page)
      showNotificationIfNeeded(payload, logoUrl);

      // Invalidate queries based on notification type to ensure fresh data
      const type = payload.data?.type || payload.notification?.type;
      const lowerType = type?.toLowerCase();

      // Always invalidate notifications list
      queryClient.invalidateQueries({ queryKey: ['student', 'notifications'] });

      if (lowerType) {
        if (lowerType === 'assignment') {
          queryClient.invalidateQueries({
            queryKey: ['student', 'assignments'],
          });
        } else if (
          lowerType === 'message' ||
          lowerType === 'chat' ||
          lowerType === 'new_message' ||
          lowerType === 'newmessage'
        ) {
          queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
          queryClient.invalidateQueries({ queryKey: ['chat', 'history'] });
          queryClient.invalidateQueries({ queryKey: ['chat', 'users'] });
        } else if (
          lowerType === 'exam' ||
          lowerType === 'exam result' ||
          lowerType === 'result'
        ) {
          queryClient.invalidateQueries({ queryKey: ['online-exam-list'] });
          queryClient.invalidateQueries({ queryKey: ['offline-exam-list'] });
          queryClient.invalidateQueries({
            queryKey: ['online-exam-result-list'],
          });
        } else if (lowerType === 'lesson') {
          queryClient.invalidateQueries({ queryKey: ['lessons'] });
          queryClient.invalidateQueries({ queryKey: ['subject-details'] });
        } else if (lowerType === 'attendance') {
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
        } else if (lowerType === 'class section') {
          queryClient.invalidateQueries({ queryKey: ['subject-details'] });
        }
      }

      // Fallback: if sender_id present but type didn't match any chat variant above,
      // still invalidate chat queries so FCM fallback works regardless of type value.
      const hasSenderId = payload.data?.sender_id || payload.data?.user_id;
      if (hasSenderId && !lowerType?.match(/message|chat|new_message|newmessage/)) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'history'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'users'] });
      }

      // Call the original prop if provided
      if (onNotificationReceived) {
        onNotificationReceived(payload);
      }
    },
    [setLastNotification, queryClient, onNotificationReceived, logoUrl]
  );

  useForegroundNotifications(handleNotification);
  useSyncFCMToken();

  return (
    <>
      <ServiceWorkerNavigationListener onMessage={handleNotification} />
      {children}
    </>
  );
};

/**
 * PushNotificationLayout centralizes all notification-related hooks.
 * It keeps hooks alive and renders the service worker listener once.
 */
const PushNotificationLayout = ({
  children,
  onNotificationReceived = () => {},
}) => {
  return (
    <NotificationProvider>
      <PushNotificationContent onNotificationReceived={onNotificationReceived}>
        {children}
      </PushNotificationContent>
    </NotificationProvider>
  );
};

export default PushNotificationLayout;
