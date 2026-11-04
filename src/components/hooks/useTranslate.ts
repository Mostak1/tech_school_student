'use client';

import { useAppSelector } from '@/components/store';
import enTranslations from '@/lib/student/translations/en.json';

/**
 * Custom hook to translate text based on current language from Redux store
 * @returns A translate function that takes a key and returns the translated string
 * 
 * @example
 * ```tsx
 * const translate = useTranslate();
 * const homeText = translate('home'); // Returns "Home" in English, "होम" in Hindi, etc.
 * ```
 */
export function useTranslate() {
  // Get translations from Redux store
  const translations = useAppSelector((state) => state.language.translations);

  /**
   * Translate a key to its corresponding translated string
   * @param key - The translation key to look up
   * @returns The translated string, or the key if translation is not found
   */
  const translate = (key: string): string => {
    // Return translated text if available, fallback to en.json, otherwise return the key
    return translations[key] || (enTranslations as Record<string, string>)[key] || key;
  };

  return translate;
}

