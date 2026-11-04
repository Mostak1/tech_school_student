import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  updateAxiosToken,
  clearAxiosToken,
  updateAxiosSchoolCode,
  clearAxiosSchoolCode,
} from '@/lib/api/student/axiosConfig';
import { StudentUser } from '@/lib/api/student/functions';

// Define the student auth state interface
// Store complete user data from API response
interface StudentAuthState {
  isAuthenticated: boolean;
  user: StudentUser | null; // Store complete user object from API
  token: string | null;
  schoolCode: string | null; // Store school code for API headers
  loading: boolean;
  error: string | null;
}

// LocalStorage keys for auth persistence
const AUTH_STORAGE_KEY = 'student_auth_state';

// Helper function to save auth state to localStorage
const saveAuthToLocalStorage = (
  user: StudentUser | null,
  token: string | null,
  schoolCode: string | null
) => {
  if (typeof window !== 'undefined') {
    if (user && token && schoolCode) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user, token, schoolCode })
      );
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }
};

// Helper function to load auth state from localStorage
// This should only be called on the client side after mount
export const loadAuthFromLocalStorage = (): {
  user: StudentUser | null;
  token: string | null;
  schoolCode: string | null;
} | null => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Use console.log to prevent error overlay in development
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }
  return null;
};

// Initial state - start with unauthenticated to match server render
// This prevents hydration mismatch between server and client
// Auth state will be rehydrated from localStorage after client mount
const initialState: StudentAuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  schoolCode: null,
  loading: false,
  error: null,
};

// Create the student auth slice
const studentAuthSlice = createSlice({
  name: 'studentAuth',
  initialState,
  reducers: {
    // Rehydrate auth state from localStorage after client mount
    // This action should be dispatched once after the app mounts on the client
    // It prevents hydration mismatch by loading persisted state after initial render
    rehydrateAuth: (state) => {
      const storedAuth = loadAuthFromLocalStorage();
      if (storedAuth?.token && storedAuth?.user) {
        state.isAuthenticated = true;
        state.user = storedAuth.user;
        state.token = storedAuth.token;
        state.schoolCode = storedAuth.schoolCode;

        // Update axios config with restored auth data
        updateAxiosToken(storedAuth.token);
        if (storedAuth.schoolCode) {
          updateAxiosSchoolCode(storedAuth.schoolCode);
        }
      }
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error message
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Login success
    loginSuccess: (
      state,
      action: PayloadAction<{ user: StudentAuthState['user']; token: string }>
    ) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      // Extract school code from user data
      state.schoolCode = action.payload.user?.school?.code || null;
      state.loading = false;
      state.error = null;

      // Save auth state to localStorage for persistence
      saveAuthToLocalStorage(
        action.payload.user,
        action.payload.token,
        state.schoolCode
      );

      // Update axios token and school code for future requests
      updateAxiosToken(action.payload.token);
      updateAxiosSchoolCode(state.schoolCode);
    },

    // Logout
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.schoolCode = null;
      state.loading = false;
      state.error = null;

      // Clear auth state from localStorage
      saveAuthToLocalStorage(null, null, null);

      // Clear axios token and school code
      clearAxiosToken();
      clearAxiosSchoolCode();
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Login action (for handling login process)
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    // Login failure
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.schoolCode = null;

      // Clear axios token and school code on failure
      clearAxiosToken();
      clearAxiosSchoolCode();
    },

    // Update user profile data without affecting token or auth status
    updateUserProfile: (state, action: PayloadAction<StudentAuthState['user']>) => {
      state.user = action.payload;
      // Also update school code if it changed
      if (action.payload?.school?.code) {
        state.schoolCode = action.payload.school.code;
        saveAuthToLocalStorage(
          action.payload,
          state.token,
          action.payload.school.code
        );
      } else {
        saveAuthToLocalStorage(action.payload, state.token, state.schoolCode);
      }
    },
  },
});

// Export actions
export const {
  rehydrateAuth,
  setLoading,
  setError,
  loginSuccess,
  logout,
  clearError,
  loginStart,
  loginFailure,
  updateUserProfile,
} = studentAuthSlice.actions;

// Export reducer
export default studentAuthSlice.reducer;
