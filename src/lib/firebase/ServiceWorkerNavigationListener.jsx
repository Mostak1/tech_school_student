'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url);
const withLeadingSlash = (url) => (url.startsWith('/') ? url : `/${url}`);

const ServiceWorkerNavigationListener = ({ onMessage }) => {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleNavigationMessage = (event) => {
      const msg = event.data;
      if (!msg || !msg.data) {
        // console.log('[Navigation Listener] No data in message:', msg);
        // return; // Don't return yet, let's see what msg is
      }

      // console.log('[Navigation Listener] Received message:', msg);

      if (typeof onMessage === 'function') {
        onMessage(msg);
      }

      const navigatePayload =
        (msg.action === 'navigate' && msg.url) ||
        (msg.type === 'NAVIGATE' && msg.url);

      if (!navigatePayload) {
        return;
      }

      const rawUrl = msg.url;
      if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
        return;
      }

      // console.log('[Navigation Listener] Raw URL:', rawUrl);

      // Determine the target pathname
      let targetPathname = '';

      // Check if URL is absolute
      if (isAbsoluteUrl(rawUrl)) {
        // Check if it's from the same origin
        try {
          const urlObj = new URL(rawUrl);
          const currentOrigin = window.location.origin;

          // console.log('[Navigation Listener] URL origin:', urlObj.origin);
          // console.log('[Navigation Listener] Current origin:', currentOrigin);

          if (urlObj.origin === currentOrigin) {
            // Same origin - extract pathname
            targetPathname = urlObj.pathname + urlObj.search + urlObj.hash;
          } else {
            // Different origin - use full page navigation
            // console.log(
            //   '[Navigation Listener] Different origin, using window.location.href'
            // );
            window.location.href = rawUrl;
            return;
          }
        } catch (error) {
          console.error('[Navigation Listener] Error parsing URL:', error);
          window.location.href = rawUrl;
          return;
        }
      } else {
        // Relative URL
        targetPathname = withLeadingSlash(rawUrl.trim());
      }

      // console.log('[Navigation Listener] Target pathname:', targetPathname);
      // console.log(
      //   '[Navigation Listener] Current pathname:',
      //   window.location.pathname
      // );

      // Check if we're already on the target page
      const currentPath =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      if (currentPath === targetPathname) {
        // console.log(
        //   '[Navigation Listener] Already on target page, skipping navigation'
        // );
        return;
      }

      // Navigate using router.push for smooth client-side navigation
      // console.log('[Navigation Listener] Navigating to:', targetPathname);

      try {
        // In Next.js 15, router.push() is void and doesn't return a Promise
        router.push(targetPathname);
      } catch (error) {
        console.error('[Navigation Listener] Router.push failed:', error);
        window.location.href = `${window.location.origin}${targetPathname}`;
      }
    };

    navigator.serviceWorker.addEventListener(
      'message',
      handleNavigationMessage
    );

    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.addEventListener('message', handleNavigationMessage);
    }

    return () => {
      navigator.serviceWorker.removeEventListener(
        'message',
        handleNavigationMessage
      );
      if (controller) {
        controller.removeEventListener('message', handleNavigationMessage);
      }
    };
  }, [router, onMessage]);

  return null;
};

export default ServiceWorkerNavigationListener;
