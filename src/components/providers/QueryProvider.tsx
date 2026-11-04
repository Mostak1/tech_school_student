'use client';

import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/components/lib/queryClient';

// TanStack Query provider component
interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // Track if component has mounted on client side
  // This prevents hydration mismatch with ReactQueryDevtools
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted (client-side only)
    setIsMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development and after mount to prevent hydration mismatch */}
      {/* ReactQueryDevtools renders differently on server vs client */}
      {isMounted && process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
