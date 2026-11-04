'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook to detect internet connectivity status
 * Returns an object with:
 * - isOnline: true if online, false if offline
 * - isMounted: true after first client-side render (prevents hydration mismatch)
 *
 * This hook listens to browser's online/offline events
 * and updates the status in real-time
 */
export function useOnlineStatus() {
  // Track if component has mounted on client side
  // This prevents hydration mismatch between server and client
  const [isMounted, setIsMounted] = useState(false);

  // Initialize with true to match server-side render
  // Will be updated after mount to actual status
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Mark as mounted (client-side only)
    setIsMounted(true);

    // Set the actual online status after mounting
    // This happens after hydration, so no mismatch occurs
    setIsOnline(navigator.onLine);

    // Handler when internet connection is restored
    const handleOnline = () => {
      setIsOnline(true);
    };

    // Handler when internet connection is lost
    const handleOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup: Remove event listeners on component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isMounted };
}
