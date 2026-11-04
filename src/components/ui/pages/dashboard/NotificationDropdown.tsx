'use client';

import { useState, useRef, useEffect } from 'react';
import { BiBell } from 'react-icons/bi';
import { cn } from '@/components/lib/utils';
import { useTranslate } from '@/components/hooks/useTranslate';
import { useGetNotifications } from '@/lib/api/student/queryHooks';
import Link from 'next/link';
import Image from 'next/image';
import {
  getNotificationRedirectUrl,
  type NotificationWithPayload,
} from '@/lib/firebase/notificationRedirect';

/**
 * Format notification timestamp to readable format
 * Converts API format (YYYY/MM/DD HH:mm or DD-MM-YYYY HH:mm) to relative or absolute time
 */
function formatNotificationTimestamp(
  timestamp: string | null | undefined
): string {
  if (!timestamp || typeof timestamp !== 'string' || timestamp.trim() === '') {
    return 'Recently';
  }

  try {
    const trimmedTimestamp = timestamp.trim();
    const parts = trimmedTimestamp.split(' ');
    const datePart = parts[0];
    const timePart = parts.length > 1 ? parts[1] : null;

    if (!datePart) return 'Recently';

    const delimiter = datePart.includes('/') ? '/' : '-';
    const dateParts = datePart.split(delimiter);

    if (dateParts.length !== 3) return 'Recently';

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
      return 'Recently';
    }

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
      return 'Recently';
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
    return 'Recently';
  }
}

interface NotificationDropdownProps {
  notificationCount?: number;
}

export default function NotificationDropdown({ }: NotificationDropdownProps) {
  const translate = useTranslate();

  // Fetch notifications from API (limit to 5 for dropdown)
  const { data, isLoading } = useGetNotifications({ offset: 0, limit: 5 });

  // Get notifications from API response
  // API returns: { success: true, data: Notification[] }
  const notifications = Array.isArray(data?.data) ? data.data.slice(0, 5) : [];

  // Get total count from API (if available, otherwise use length)
  const notificationCount = notifications.length;
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
        setTimeout(() => setIsOpen(false), 150);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isOpen]);

  // Handle trigger click
  const handleTriggerClick = () => {
    if (isOpen) {
      setIsVisible(false);
      setTimeout(() => setIsOpen(false), 150);
    } else {
      setIsOpen(true);
      setTimeout(() => setIsVisible(true), 10);
    }
  };

  // Handle hover events
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsOpen(true);
    setTimeout(() => setIsVisible(true), 10);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setIsOpen(false), 150);
    }, 150);
  };

  return (
    <div className="relative">
      {/* Trigger Button - Responsive sizing for all devices */}
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer"
      >
        <button className="p-1.5 md:p-2 rounded-[4px] transition-colors relative border border-(--primary-color)">
          <BiBell className="w-4 h-4 md:w-5 md:h-5 text-(--primary-color)" />
          {notificationCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-(--primary-color) text-white text-[10px] md:text-xs rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center font-medium">
              {notificationCount}
            </span>
          )}
        </button>
      </div>

      {/* Dropdown Content - Fully responsive with mobile-first approach */}
      {isOpen && (
        <div
          ref={dropdownRef}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
          }}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'fixed sm:absolute top-[60px] sm:top-full right-2 sm:right-0 z-50 sm:mt-1',
            'w-[calc(100vw-1rem)] max-w-[360px] sm:w-[340px] md:w-[400px]',
            'overflow-hidden rounded-lg border bg-white shadow-lg',
            'transition-all duration-200 ease-in-out',
            isVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 -translate-y-1'
          )}
        >
          {/* Notification List - Responsive padding and height */}
          <div className="h-[300px] sm:h-[340px] md:h-[360px] overflow-y-auto p-2.5 sm:p-3 md:p-4 scrollbar-thin">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-xs sm:text-sm">{translate('loading')}</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && notifications.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 text-center">
                  <BiBell className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs sm:text-sm">
                    {translate('noNotifications')}
                  </p>
                </div>
              </div>
            )}

            {/* Notifications List */}
            {!isLoading &&
              notifications.map((notification) => {
                const formattedTimestamp = formatNotificationTimestamp(
                  notification.created_at
                );

                // Get redirect URL based on notification type and payload
                // Cast notification to include payload fields that may come from Firebase
                const redirectUrl =
                  getNotificationRedirectUrl(
                    notification as NotificationWithPayload
                  ) || '/student/notifications';

                return (
                  <Link
                    key={notification.id}
                    href={redirectUrl}
                    className="block px-0 mb-2.5 sm:mb-3 md:mb-4 hover:opacity-80 transition-opacity"
                    onClick={() => {
                      setIsVisible(false);
                      setTimeout(() => setIsOpen(false), 150);
                    }}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-2.5 md:space-x-3 bg-(--light-primary-color) p-2 sm:p-2.5 md:p-3 border border-gray-200 rounded-lg">
                      {/* Notification Icon/Image - Responsive sizing */}
                      {notification.image ? (
                        <div className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 relative rounded">
                          <Image
                            src={notification.image}
                            alt={notification.title}
                            fill
                            className="object-cover rounded"
                            sizes="32px"
                          />
                        </div>
                      ) : (
                        <div className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gray-200 rounded flex items-center justify-center">
                          <BiBell className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-gray-500" />
                        </div>
                      )}

                      {/* Notification Content - Responsive text sizing */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-900 mb-0.5 line-clamp-1">
                              {notification.title}
                            </h4>
                            <p className="text-[11px] sm:text-xs md:text-sm font-normal text-gray-500 leading-relaxed line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <span className="text-[9px] sm:text-[10px] md:text-xs font-normal shrink-0 text-gray-400 whitespace-nowrap">
                            {formattedTimestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}

            {/* View All Button - Responsive sizing */}
            {!isLoading && notifications.length > 0 && (
              <div className="mt-2.5 sm:mt-3 md:mt-4">
                <Link
                  href="/student/notifications"
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => setIsOpen(false), 150);
                  }}
                  className="block w-full bg-(--primary-color) text-white py-1.5 sm:py-2 md:py-2 px-3 sm:px-3 md:px-4 rounded-[4px] text-sm sm:text-base md:text-xl font-normal hover:bg-opacity-90 transition-colors text-center"
                >
                  {translate('viewAll')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
