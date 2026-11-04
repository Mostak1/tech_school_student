'use client';

import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';

// Toast provider component for global toast notifications using shadcn/ui Sonner
// Only renders on client side to avoid hydration mismatch
export default function ToastProvider() {
  const [mounted, setMounted] = useState(false);

  // Determine position based on document direction
  // Default to top-right (LTR), switch to top-left for RTL
  const [position, setPosition] = useState<
    'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  >('top-right');

  // Wait for component to mount on client side before rendering Toaster
  // This prevents hydration mismatch between server and client
  useEffect(() => {
    setMounted(true);

    const updatePosition = () => {
      const dir = document.documentElement.dir || document.body.dir;
      if (dir === 'rtl') {
        setPosition('top-left');
      } else {
        setPosition('top-right');
      }
    };

    // Initial check
    updatePosition();

    // Watch for direction changes
    const observer = new MutationObserver(updatePosition);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    });

    return () => observer.disconnect();
  }, []);

  // Don't render anything on server side
  if (!mounted) {
    return null;
  }

  return <Toaster position={position} richColors closeButton />;
}
