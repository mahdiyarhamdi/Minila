/**
 * i18n Configuration - تنظیمات چندزبانگی
 */

export const languages = {
  en: {
    name: 'English',
    nativeName: 'English',
    dir: 'ltr' as const,
    fontFamily: 'Inter',
    dateLocale: 'en-US',
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl' as const,
    fontFamily: 'Noto Sans Arabic',
    dateLocale: 'ar-SA',
  },
  fa: {
    name: 'Persian',
    nativeName: 'فارسی',
    dir: 'rtl' as const,
    fontFamily: 'IRANYekan',
    dateLocale: 'fa-IR',
  },
} as const

export const defaultLanguage: Language = 'en'
export const supportedLanguages = Object.keys(languages) as Language[]

export type Language = keyof typeof languages
export type Direction = 'ltr' | 'rtl'

/**
 * Get language configuration
 */
export function getLanguageConfig(lang: Language) {
  return languages[lang] || languages[defaultLanguage]
}

/**
 * Check if language is RTL
 */
export function isRTL(lang: Language): boolean {
  return getLanguageConfig(lang).dir === 'rtl'
}

/**
 * Get date locale for formatting
 */
export function getDateLocale(lang: Language): string {
  return getLanguageConfig(lang).dateLocale
}

/**
 * Storage key for language preference
 */
export const LANGUAGE_STORAGE_KEY = 'minila-language'

