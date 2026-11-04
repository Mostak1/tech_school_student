'use client';

import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from './index';
import { rehydrateAuth } from './slices/studentAuthSlice';
import { setStoreDispatch } from '@/lib/api/student/axiosConfig';

// Redux provider component to wrap the app
interface ReduxProviderProps {
  children: React.ReactNode;
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
  // Track if we've already rehydrated to prevent multiple calls
  const hasRehydrated = useRef(false);

  useEffect(() => {
    // Rehydrate auth state from localStorage after client mount
    // This happens after hydration, preventing mismatch between server and client
    if (!hasRehydrated.current) {
      hasRehydrated.current = true;

      // Set the store dispatch for axios interceptor
      // This allows the interceptor to dispatch logout action on deactivation
      setStoreDispatch(store.dispatch);

      // Rehydrate auth state from localStorage
      store.dispatch(rehydrateAuth());
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
