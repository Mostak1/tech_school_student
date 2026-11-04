'use client';
import { useSidebar } from '@/components/contexts/SidebarContext';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { BiHomeSmile, BiBell } from 'react-icons/bi';
import { useGetNotifications } from '@/lib/api/student/queryHooks';
import { Notification } from '@/lib/api/student/functions';
import Image from 'next/image';
import { useTranslate } from '@/components/hooks/useTranslate';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  getNotificationRedirectUrl,
  type NotificationWithPayload,
} from '@/lib/firebase/notificationRedirect';

/**
 * Format notification timestamp to readable format
 * Converts API format (DD-MM-YYYY HH:mm or YYYY/MM/DD HH:mm) to relative or absolute time
 */
function formatNotificationTimestamp(
  timestamp: string | null | undefined,
  translate: (key: string) => string
): string {
  // Return default message if timestamp is missing or invalid
  if (!timestamp || typeof timestamp !== 'string' || timestamp.trim() === '') {
    return translate('recently');
  }

  try {
    const trimmedTimestamp = timestamp.trim();
    const parts = trimmedTimestamp.split(' ');
    const datePart = parts[0];
    const timePart = parts.length > 1 ? parts[1] : null;

    if (!datePart) return translate('recently');

    const delimiter = datePart.includes('/') ? '/' : '-';
    const dateParts = datePart.split(delimiter);

    if (dateParts.length !== 3) return translate('recently');

    let day: number, month: number, year: number;
    const p0 = Number(dateParts[0]);
    const p1 = Number(dateParts[1]);
    const p2 = Number(dateParts[2]);

    // Handle different date formats
    if (dateParts[0].length === 4) {
      // YYYY/MM/DD or YYYY/DD/MM
      year = p0;
      // Assume YYYY/MM/DD unless month > 12
      if (p1 > 12) {
        day = p1;
        month = p2;
      } else {
        month = p1;
        day = p2;
      }
    } else if (dateParts[2].length === 4) {
      // DD/MM/YYYY or MM/DD/YYYY
      year = p2;
      // Assume DD/MM/YYYY unless day > 12 (ambiguous cases treated as DD/MM)
      if (p0 > 12) {
        day = p0;
        month = p1;
      } else {
        // Default to DD/MM/YYYY for consistency with typical non-US formats
        day = p0;
        month = p1;
      }
    } else {
      return translate('recently');
    }

    // Validate parsed numbers are valid
    if (
      isNaN(day) ||
      isNaN(month) ||
      isNaN(year) ||
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12 ||
      year < 1900
    ) {
      return translate('recently');
    }

    // Format Date: DD-MM-YYYY
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDate = `${formattedDay}-${formattedMonth}-${year}`;

    // Format Time: HH:mm
    if (timePart) {
      const timeParts = timePart.split(':');
      if (timeParts.length >= 2) {
        const hours = Number(timeParts[0]);
        const minutes = Number(timeParts[1]);

        // Validate time values
        if (
          !isNaN(hours) &&
          !isNaN(minutes) &&
          hours >= 0 &&
          hours <= 23 &&
          minutes >= 0 &&
          minutes <= 59
        ) {
          const formattedHours = hours.toString().padStart(2, '0');
          const formattedMinutes = minutes.toString().padStart(2, '0');
          return `${formattedDate} ${formattedHours}:${formattedMinutes}`;
        }
      }
    }

    return formattedDate;
  } catch {
    // If parsing fails, return a safe default
    return translate('recently');
  }
}

export default function NotificationsPage() {
  const { collapsed } = useSidebar();
  const translate = useTranslate();

  // State for pagination
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10); // Initial limit set to 10
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Fetch notifications from API with offset and limit
  const { data, isLoading, isError, error, isFetching } = useGetNotifications({
    offset,
    limit,
  });

  const breadcrumbItems = useMemo(() => [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('notifications'),
    },
  ], [translate]);

  // Extract notifications from API response and accumulate them
  useEffect(() => {
    // Extract notifications array from API response
    // API returns: { success: true, data: Notification[] }
    const newNotifications: Notification[] = Array.isArray(data?.data)
      ? data.data
      : [];

    if (!data) {
      return;
    }

    // On first load or when offset is 0, replace all notifications
    if (offset === 0) {
      setAllNotifications(newNotifications);
      // Check if there are more notifications to load
      setHasMore(newNotifications.length >= limit);
    } else {
      // For subsequent loads, append new notifications
      // Filter out duplicates based on notification ID
      setAllNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const uniqueNewNotifications = newNotifications.filter(
          (n) => !existingIds.has(n.id)
        );
        return [...prev, ...uniqueNewNotifications];
      });
      // Check if there are more notifications to load
      setHasMore(newNotifications.length >= limit);
    }
  }, [data, offset, limit]);

  // Handle load more button click - optimized dependency array
  const handleLoadMore = useCallback(() => {
    setOffset((prevOffset) => prevOffset + limit);
  }, [limit]);

  // Show loading state only on initial load
  if (isLoading && offset === 0) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb
          title={translate('notifications')}
          items={breadcrumbItems}
        />
        <div className="bg-white rounded-[12px] border border-gray-200 p-8 flex items-center justify-center">
          <div className="text-gray-500 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>{translate('loadingNotifications')}</p>
          </div>
        </div>
      </Container>
    );
  }

  // Show error state
  if (isError) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb
          title={translate('notifications')}
          items={breadcrumbItems}
        />
        <div className="bg-white rounded-[12px] border border-gray-200 p-8">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold mb-2">
              {translate('failedToLoadNotifications')}
            </p>
            <p className="text-sm text-gray-600">
              {error instanceof Error
                ? error.message
                : translate('unknownErrorOccurred')}
            </p>
          </div>
        </div>
      </Container>
    );
  }

  // Show empty state only if not loading and no notifications
  if (!isLoading && (!allNotifications || allNotifications.length === 0)) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb
          title={translate('notifications')}
          items={breadcrumbItems}
        />
        <div className="bg-white rounded-[12px] border border-gray-200 p-8">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-medium mb-2">
              {translate('noNotifications')}
            </p>
            <p className="text-sm">{translate('noNotificationsAvailable')}</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container collapsed={collapsed}>
      <Breadcrumb title={translate('notifications')} items={breadcrumbItems} />

      {/* Notifications List - Responsive padding and spacing */}
      <div className="space-y-3 sm:space-y-4 bg-white rounded-[12px] border border-gray-200 overflow-hidden p-3 sm:p-4">
        {allNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
          />
        ))}

        {/* Load More Button */}
        {hasMore && (
          <div className="pt-4 flex justify-center">
            <Button
              onClick={handleLoadMore}
              disabled={isFetching}
              className="bg-(--primary-color) hover:bg-(--primary-color)/90 text-white px-6 py-2 rounded-[4px] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetching ? translate('loading') : translate('loadMore')}
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
}

/**
 * Single Notification Item Component
 * Handles image loading with fallback to placeholder icon
 * Makes notifications clickable to redirect to appropriate pages
 * Memoized using React.memo to prevent redundant re-renders when appending items
 */
const NotificationItem = React.memo(function NotificationItem({
  notification,
}: {
  notification: Notification;
}) {
  const translate = useTranslate();
  const router = useRouter();

  // Track if image failed to load
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !notification.image || imageError;

  // Format timestamp from API format to readable format - memoized locally
  const formattedTimestamp = useMemo(() => {
    return formatNotificationTimestamp(notification.created_at, translate);
  }, [notification.created_at, translate]);

  // Get redirect URL based on notification type and payload
  // Cast notification to include payload fields that may come from Firebase
  const redirectUrl =
    getNotificationRedirectUrl(notification as NotificationWithPayload) ||
    '/student/notifications';

  // Handle notification click to redirect
  const handleClick = () => {
    router.push(redirectUrl);
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col gap-3 p-3 sm:p-4 border border-gray-200 rounded-[12px] bg-(--light-primary-color) cursor-pointer hover:bg-gray-50 transition-colors"
    >
      {/* Top row: Icon/Image, Content, and Timestamp (desktop only) */}
      <div className="flex items-start gap-3">
        {/* Icon/Image - Show notification image if available, otherwise show placeholder */}
        {notification.image && !imageError ? (
          <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 relative">
            <Image
              src={notification.image}
              alt={notification.title}
              fill
              className="object-cover rounded-md"
              sizes="(max-width: 640px) 40px, 48px"
              onError={() => {
                // Show placeholder if image fails to load
                setImageError(true);
              }}
            />
          </div>
        ) : null}

        {/* Placeholder icon - shown when image is not available or fails to load */}
        {showPlaceholder && (
          <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-md flex items-center justify-center">
            <BiBell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          </div>
        )}

        {/* Content area - Title and Description */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">
            {notification.title}
          </h3>

          {/* Description - Use message field from API */}
          <p className="text-xs sm:text-sm font-normal text-gray-600 leading-relaxed">
            {notification.message}
          </p>
        </div>

        {/* Timestamp - Desktop only (right side) */}
        <div className="hidden sm:block shrink-0 text-sm font-normal text-gray-500 whitespace-nowrap">
          {formattedTimestamp}
        </div>
      </div>

      {/* Timestamp - Mobile only (below content) */}
      <div className="sm:hidden text-xs text-gray-500 font-normal pl-[52px]">
        {formattedTimestamp}
      </div>
    </div>
  );
});
