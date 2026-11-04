import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

// Import your slices here as you create them
import studentAuthSlice from './slices/studentAuthSlice';
import examSlice from './slices/examSlice';
import languageSlice from './slices/languageSlice';
// import userSlice from './slices/userSlice'

export const store = configureStore({
  reducer: {
    // Add your reducers here
    studentAuth: studentAuthSlice,
    exam: examSlice,
    language: languageSlice,
    // user: userSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
