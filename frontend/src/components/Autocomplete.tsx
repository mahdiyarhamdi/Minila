'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

// Base interface - allows extra properties
export interface AutocompleteOption {
  id: number
  label: string
  value: string
  [key: string]: unknown // Allow extra properties like isoCode
}

interface AutocompleteProps {
  label: string
  placeholder?: string
  value: AutocompleteOption | null
  onChange: (option: AutocompleteOption | null) => void
  onSearch: (query: string) => Promise<AutocompleteOption[]>
  disabled?: boolean
  error?: string
  helperText?: string
  required?: boolean
}

/**
 * کامپوننت Autocomplete با قابلیت جستجو
 * 
 * این کامپوننت برای جستجوی کشورها و شهرها استفاده می‌شود.
 * با debounce برای جلوگیری از درخواست‌های زیاد.
 */
export default function Autocomplete({
  label,
  placeholder,
  value,
  onChange,
  onSearch,
  disabled = false,
  error,
  helperText,
  required = false,
}: AutocompleteProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState(value?.label || '')
  const [options, setOptions] = useState<AutocompleteOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [hasSearched, setHasSearched] = useState(false) // برای نمایش "نتیجه‌ای یافت نشد"
  
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout>()
  const onSearchRef = useRef(onSearch)

  // به‌روزرسانی reference تابع جستجو
  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  // بستن dropdown هنگام کلیک خارج از component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // به‌روزرسانی inputValue هنگام تغییر value از خارج
  useEffect(() => {
    setInputValue(value?.label || '')
  }, [value])

  // جستجو با debounce
  useEffect(() => {
    if (!inputValue || disabled) {
      setOptions([])
      setHasSearched(false)
      setIsOpen(false)
      return
    }

    // اگر inputValue دقیقاً برابر با مقدار انتخاب شده باشد، جستجو نکن
    if (value && inputValue === value.label) {
      return
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true)
      setHasSearched(false)
      try {
        const results = await onSearchRef.current(inputValue)
        setOptions(results)
        setHasSearched(true)
        setIsOpen(true)
      } catch (error) {
        console.error('Search error:', error)
        setOptions([])
        setHasSearched(true)
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [inputValue, disabled, value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedIndex(-1)
    
    // اگر input خالی شد، مقدار را null کن
    if (!newValue) {
      onChange(null)
    }
  }

  const handleOptionClick = (option: AutocompleteOption) => {
    setInputValue(option.label)
    onChange(option)
    setIsOpen(false)
    setOptions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || options.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev < options.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < options.length) {
          handleOptionClick(options[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // فقط dropdown را باز کن اگر نتایجی موجود باشند
            if (options.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder || t('common.search')}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 bg-white border rounded-lg
            text-neutral-900 placeholder-neutral-400
            transition-all duration-200
            ${disabled
              ? 'bg-neutral-100 cursor-not-allowed opacity-60'
              : 'hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
            }
            ${error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-neutral-300'
            }
          `}
        />
        
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute ltr:right-10 rtl:left-10 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Dropdown icon */}
        {!isLoading && (
          <svg
            className={`absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.length > 0 ? (
            options.map((option, index) => (
                <button
                key={option.id}
                type="button"
                onClick={() => handleOptionClick(option)}
                className={`
                  w-full px-4 py-2.5 text-start transition-colors
                  ${index === selectedIndex
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-neutral-50 text-neutral-900'
                  }
                  ${index > 0 ? 'border-t border-neutral-100' : ''}
                `}
              >
                {option.label}
              </button>
            ))
          ) : hasSearched ? (
            <div className="px-4 py-3 text-sm text-neutral-500 text-center">
              {t('common.noResults')}
            </div>
          ) : null}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-sm text-red-600 font-light">{error}</p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-neutral-500 font-light">{helperText}</p>
      )}
    </div>
  )
}

