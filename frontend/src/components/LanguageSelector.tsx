'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { languages, Language } from '@/i18n/config'
import { cn } from '@/lib/utils'

interface LanguageSelectorProps {
  className?: string
  variant?: 'desktop' | 'mobile'
}

/**
 * LanguageSelector - کامپوننت انتخاب زبان
 */
export default function LanguageSelector({ className, variant = 'desktop' }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setIsOpen(false)
  }

  const languageList = Object.entries(languages) as [Language, typeof languages[Language]][]
  const currentLanguage = languages[language]

  // Mobile variant - simple list
  if (variant === 'mobile') {
    return (
      <div className={cn('space-y-1', className)}>
        <p className="px-4 py-1 text-xs text-neutral-500 font-medium">
          {language === 'en' ? 'Language' : language === 'ar' ? 'اللغة' : 'زبان'}
        </p>
        {languageList.map(([code, config]) => (
          <button
            key={code}
            onClick={() => handleLanguageChange(code)}
            className={cn(
              'w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3',
              code === language
                ? 'bg-primary-50 text-primary-600'
                : 'text-neutral-700 hover:bg-neutral-100'
            )}
          >
            <span>{config.nativeName}</span>
            {code === language && (
              <svg className="w-4 h-4 ltr:ml-auto rtl:mr-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    )
  }

  // Desktop variant - dropdown
  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
        aria-label="Select language"
      >
        {/* Globe Icon */}
        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
        <span className="text-sm font-medium text-neutral-700 hidden sm:inline">
          {currentLanguage.nativeName}
        </span>
        <svg
          className={cn(
            'w-4 h-4 text-neutral-500 transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-40 bg-white rounded-xl shadow-strong border border-neutral-200 py-2 z-50">
          {languageList.map(([code, config]) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              className={cn(
                'w-full px-4 py-2 text-sm transition-colors flex items-center gap-2',
                code === language
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50'
              )}
            >
              <span>{config.nativeName}</span>
              {code === language && (
                <svg className="w-4 h-4 ltr:ml-auto rtl:mr-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

