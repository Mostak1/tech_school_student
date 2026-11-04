'use client';

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/components/store';
import {
  setLanguage,
  setLanguages,
  setTranslations,
  setLoading,
  setError,
  rehydrateLanguage,
  LanguageCode,
  Language,
} from '@/components/store/slices/languageSlice';
import {
  getLanguages,
  setLanguageApi,
  ApiLanguage,
} from '@/lib/api/student/functions';
import enTranslations from '@/lib/student/translations/en.json';

// The web panel always requests the 'web' translation file
const LANGUAGE_TYPE = 'web';

// Module level caches so that the APIs are hit once per app load even though
// useLanguage() is consumed by many components at the same time
let languagesPromise: Promise<Language[]> | null = null;
const translationPromises = new Map<string, Promise<Record<string, string>>>();

// Map the API shape to the shape used by the store
const mapApiLanguage = (lang: ApiLanguage): Language => ({
  id: lang.id,
  name: lang.name,
  code: lang.code,
  image: lang.image,
  isRtl: lang.is_rtl === 1,
});

// Fetch the active languages once and share the same promise with every caller
const fetchLanguages = (): Promise<Language[]> => {
  if (!languagesPromise) {
    languagesPromise = getLanguages()
      .then((response) => (response.data || []).map(mapApiLanguage))
      .catch((error) => {
        // Reset so a later mount can retry the request
        languagesPromise = null;
        throw error;
      });
  }
  return languagesPromise;
}

// Fetch translations for a language once and share the same promise
const fetchTranslations = (
  code: string
): Promise<Record<string, string>> => {
  const cached = translationPromises.get(code);
  if (cached) {
    return cached;
  }

  const promise = setLanguageApi(code, LANGUAGE_TYPE)
    .then((response) => response.data?.file_name || {})
    .catch((error) => {
      // Reset so a later language switch can retry the request
      translationPromises.delete(code);
      throw error;
    });

  translationPromises.set(code, promise);
  return promise;
};

/**
 * Custom hook to manage language state and translations
 * Languages and translations both come from the API:
 * - GET  /get-languages  -> available languages
 * - POST /set-languages  -> translations for the selected language
 *
 * @returns Language state and functions to change language
 */
export function useLanguage() {
  const dispatch = useAppDispatch();

  // Get language state from Redux store
  const {
    currentLanguage,
    currentLanguageName,
    languages,
    translations,
    loading,
    error,
  } = useAppSelector((state) => state.language);

  // Merge with fallback translations
  const mergedTranslations = useMemo(() => {
    return {
      ...(enTranslations as Record<string, string>),
      ...translations,
    };
  }, [translations]);

  // Rehydrate language from localStorage on mount
  useEffect(() => {
    dispatch(rehydrateLanguage());
  }, [dispatch]);

  // Load the available languages from the API on mount
  useEffect(() => {
    let cancelled = false;

    fetchLanguages()
      .then((availableLanguages) => {
        if (!cancelled) {
          dispatch(setLanguages(availableLanguages));
        }
      })
      .catch((err) => {
        console.error('Failed to load languages:', err);
        if (!cancelled) {
          dispatch(setError('Failed to load languages'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  // Load translations when language changes
  useEffect(() => {
    if (!currentLanguage) {
      return;
    }

    let cancelled = false;

    dispatch(setLoading(true));

    fetchTranslations(currentLanguage)
      .then((translationsData) => {
        if (!cancelled) {
          dispatch(setTranslations(translationsData));
        }
      })
      .catch((err) => {
        console.error(
          `Failed to load translations for ${currentLanguage}:`,
          err
        );
        if (!cancelled) {
          dispatch(setError('Failed to load translations'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentLanguage, dispatch]);

  /**
   * Change the current language
   * @param lang - The language code to switch to
   */
  const changeLanguage = (lang: LanguageCode) => {
    dispatch(setLanguage(lang));
  };

  return {
    currentLanguage,
    currentLanguageName,
    languages,
    translations: mergedTranslations,
    loading,
    error,
    changeLanguage,
  };
}
