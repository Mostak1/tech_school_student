import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Language interface
export interface Language {
  id: number;
  name: string;
  code: string;
  // Flag image URL coming from the API (null when the school did not upload one)
  image: string | null;
  isRtl: boolean;
}

// Language state interface
interface LanguageState {
  // Current selected language code
  currentLanguage: string;

  // Current language name for display
  currentLanguageName: string;

  // Available languages list (loaded from the /get-languages API)
  languages: Language[];

  // Translations object - key-value pairs for translated strings
  translations: Record<string, string>;

  // Loading state for translations
  loading: boolean;

  // Error state if translation loading fails
  error: string | null;
}

// LocalStorage key for language persistence
const LANGUAGE_STORAGE_KEY = 'student-language';

// Default language used until the languages API responds
const defaultLanguage = 'en';

// Helper function to load language from localStorage
// This should only be called on the client side
export const loadLanguageFromLocalStorage = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved) {
        return saved;
      }
    } catch {
      // If there's an error reading from localStorage, use default
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    }
  }
  return defaultLanguage;
};

// Helper function to save language to localStorage
const saveLanguageToLocalStorage = (lang: string) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      // Silently fail if localStorage is not available
      console.error('Failed to save language to localStorage:', error);
    }
  }
};

// Get language name from a list of languages
const getLanguageName = (languages: Language[], code: string): string => {
  return languages.find((lang) => lang.code === code)?.name || '';
};

// Initial state
// Start with default language to prevent hydration mismatch
// Language will be rehydrated from localStorage after client mount
const initialState: LanguageState = {
  currentLanguage: defaultLanguage,
  currentLanguageName: '',
  languages: [],
  translations: {},
  loading: false,
  error: null,
};

// Create the language slice
const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    // Rehydrate language from localStorage after client mount
    // This action should be dispatched once after the app mounts on the client
    // It prevents hydration mismatch by loading persisted state after initial render
    rehydrateLanguage: (state) => {
      const savedLanguage = loadLanguageFromLocalStorage();
      state.currentLanguage = savedLanguage;
      state.currentLanguageName = getLanguageName(
        state.languages,
        savedLanguage
      );
    },

    // Set the available languages list fetched from the API
    // If the persisted language is not part of the list, fall back to the
    // first available language so the selector never shows an unknown value
    setLanguages: (state, action: PayloadAction<Language[]>) => {
      state.languages = action.payload;

      const isAvailable = action.payload.some(
        (lang) => lang.code === state.currentLanguage
      );

      if (!isAvailable && action.payload.length > 0) {
        state.currentLanguage = action.payload[0].code;
        saveLanguageToLocalStorage(state.currentLanguage);
      }

      state.currentLanguageName = getLanguageName(
        action.payload,
        state.currentLanguage
      );
    },

    // Set current language
    setLanguage: (state, action: PayloadAction<string>) => {
      state.currentLanguage = action.payload;
      state.currentLanguageName = getLanguageName(
        state.languages,
        action.payload
      );
      state.error = null;

      // Save language to localStorage for persistence
      saveLanguageToLocalStorage(action.payload);
    },

    // Set translations object
    setTranslations: (state, action: PayloadAction<Record<string, string>>) => {
      state.translations = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error message
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Export types
export type LanguageCode = string;
export type LanguageName = string;

// Export actions
export const {
  rehydrateLanguage,
  setLanguages,
  setLanguage,
  setTranslations,
  setLoading,
  setError,
  clearError,
} = languageSlice.actions;

// Export reducer
export default languageSlice.reducer;
