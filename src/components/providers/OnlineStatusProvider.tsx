'use client';

import { ReactNode } from 'react';
import { useOnlineStatus } from '@/components/hooks/useOnlineStatus';
import NoInternet from '@/components/shared/common/NoInternet';

interface OnlineStatusProviderProps {
  children: ReactNode;
}

/**
 * OnlineStatusProvider Component
 *
 * This provider wraps the application and monitors internet connectivity.
 * When the user goes offline, it displays a full-screen "No Internet" page.
 * When connection is restored, the page automatically dismisses.
 *
 * Usage:
 * Wrap your app or specific routes with this provider in the layout.
 */
export default function OnlineStatusProvider({
  children,
}: OnlineStatusProviderProps) {
  // Get current online status and mount state
  // isMounted prevents hydration mismatch by ensuring
  // server and client render the same initial HTML
  const { isOnline, isMounted } = useOnlineStatus();

  // Determine if we should show the offline overlay
  // Only show after mounting to prevent hydration mismatch
  const showOfflineOverlay = isMounted && !isOnline;

  return (
    <>
      {/* Show No Internet overlay when offline (after mount) */}
      {/* This prevents hydration mismatch since server always sees isMounted=false */}
      {/* NoInternet is a fixed full-screen overlay, so it won't affect layout */}
      {showOfflineOverlay && <NoInternet />}

      {/* Render children directly without wrapper to avoid layout issues */}
      {/* NoInternet overlay will appear on top when needed */}
      {children}
    </>
  );
}
