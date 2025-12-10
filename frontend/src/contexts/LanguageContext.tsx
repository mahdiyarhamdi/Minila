'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import {
  Language,
  Direction,
  defaultLanguage,
  getLanguageConfig,
  LANGUAGE_STORAGE_KEY,
  supportedLanguages,
} from '@/i18n/config'

// Import translations
import en from '@/i18n/locales/en.json'
import ar from '@/i18n/locales/ar.json'
import fa from '@/i18n/locales/fa.json'

const translations: Record<Language, typeof en> = { en, ar, fa }

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  dir: Direction
  t: (key: string, params?: Record<string, string | number>) => string
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string
  formatTime: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }

  return typeof current === 'string' ? current : undefined
}

/**
 * Replace template variables in string
 * e.g., "Hello {{name}}" with { name: "Ali" } => "Hello Ali"
 */
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key]?.toString() ?? `{{${key}}}`
  })
}

/**
 * LanguageProvider - مدیریت مرکزی زبان در سطح app
 */
export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize language from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored && supportedLanguages.includes(stored as Language)) {
      setLanguageState(stored as Language)
    }
    setIsInitialized(true)
  }, [])

  // Update document attributes when language changes
  useEffect(() => {
    if (!isInitialized) return

    const config = getLanguageConfig(language)
    
    // Update html attributes
    document.documentElement.lang = language
    document.documentElement.dir = config.dir
    
    // Update font family via CSS variable
    document.documentElement.style.setProperty('--font-family', config.fontFamily)
    
    // Add language-specific class for additional styling
    document.documentElement.classList.remove('lang-en', 'lang-ar', 'lang-fa')
    document.documentElement.classList.add(`lang-${language}`)
  }, [language, isInitialized])

  const setLanguage = useCallback((lang: Language) => {
    if (!supportedLanguages.includes(lang)) return
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  }, [])

  const dir = getLanguageConfig(language).dir

  /**
   * Translation function
   */
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const value = getNestedValue(translations[language] as Record<string, unknown>, key)
    if (value === undefined) {
      // Fallback to English
      const fallback = getNestedValue(translations.en as Record<string, unknown>, key)
      if (fallback === undefined) {
        console.warn(`Missing translation for key: ${key}`)
        return key
      }
      return interpolate(fallback, params)
    }
    return interpolate(value, params)
  }, [language])

  /**
   * Format date according to current language
   */
  const formatDate = useCallback((date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const config = getLanguageConfig(language)
    return dateObj.toLocaleDateString(config.dateLocale, options)
  }, [language])

  /**
   * Format time according to current language
   */
  const formatTime = useCallback((date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const config = getLanguageConfig(language)
    return dateObj.toLocaleTimeString(config.dateLocale, {
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    })
  }, [language])

  /**
   * Format number according to current language
   */
  const formatNumber = useCallback((num: number, options?: Intl.NumberFormatOptions): string => {
    const config = getLanguageConfig(language)
    return num.toLocaleString(config.dateLocale, options)
  }, [language])

  // Prevent flash of wrong language
  if (!isInitialized) {
    return null
  }

  const value: LanguageContextType = {
    language,
    setLanguage,
    dir,
    t,
    formatDate,
    formatTime,
    formatNumber,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

/**
 * Hook برای دسترسی به LanguageContext
 */
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

