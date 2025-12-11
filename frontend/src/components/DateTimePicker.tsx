'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  label?: string
  value?: string // ISO datetime string
  onChange: (value: string) => void
  includeTime?: boolean // default: true
  error?: string
  helperText?: string
  validatePast?: boolean // اگر true، تاریخ‌های گذشته invalid هستند
}

const MONTHS = [
  { value: 1, label: 'January', short: 'Jan' },
  { value: 2, label: 'February', short: 'Feb' },
  { value: 3, label: 'March', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'May', short: 'May' },
  { value: 6, label: 'June', short: 'Jun' },
  { value: 7, label: 'July', short: 'Jul' },
  { value: 8, label: 'August', short: 'Aug' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'October', short: 'Oct' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'December', short: 'Dec' },
]

// Custom Month Select - shows full name in dropdown, short name when selected
function MonthSelect({
  value,
  onChange,
  hasError,
}: {
  value: number
  onChange: (month: number) => void
  hasError: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedMonth = MONTHS.find((m) => m.value === value) || MONTHS[0]

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-neutral-600 mb-1">ماه</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-3 py-2.5 rounded-xl border transition-all',
          'text-neutral-900 bg-white text-center',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'flex items-center justify-between',
          {
            'border-neutral-200 focus:border-primary-500 focus:ring-primary-100': !hasError,
            'border-red-300 focus:border-red-500 focus:ring-red-100': hasError,
          }
        )}
      >
        <span className="flex-1">{selectedMonth.short}</span>
        <svg
          className={cn('w-4 h-4 text-neutral-400 transition-transform', {
            'rotate-180': isOpen,
          })}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {MONTHS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => {
                onChange(m.value)
                setIsOpen(false)
              }}
              className={cn(
                'w-full px-3 py-2 text-right hover:bg-primary-50 transition-colors',
                {
                  'bg-primary-100 text-primary-700 font-medium': m.value === value,
                  'text-neutral-700': m.value !== value,
                }
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * DateTimePicker با فیلدهای جداگانه برای سال، ماه، روز، ساعت و دقیقه
 */
export default function DateTimePicker({
  label,
  value,
  onChange,
  includeTime = true,
  error,
  helperText,
  validatePast = false,
}: DateTimePickerProps) {
  const now = new Date()
  
  // Parse value or use current date/time as defaults
  const parseValue = (val?: string) => {
    if (val) {
      const date = new Date(val)
      if (!isNaN(date.getTime())) {
        return date
      }
    }
    return now
  }

  const initialDate = parseValue(value)
  
  const [year, setYear] = useState<number>(initialDate.getFullYear())
  const [month, setMonth] = useState<number>(initialDate.getMonth() + 1) // 1-12
  const [day, setDay] = useState<number>(initialDate.getDate())
  const [hour, setHour] = useState<number>(initialDate.getHours())
  const [minute, setMinute] = useState<number>(initialDate.getMinutes())
  const [validationError, setValidationError] = useState<string>('')

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      const date = parseValue(value)
      setYear(date.getFullYear())
      setMonth(date.getMonth() + 1)
      setDay(date.getDate())
      setHour(date.getHours())
      setMinute(date.getMinutes())
    }
  }, [value])

  // Build ISO string from components
  const buildISOString = (y: number, m: number, d: number, h: number, min: number): string => {
    const date = new Date(y, m - 1, d, h, min, 0, 0)
    return date.toISOString()
  }

  // Validate date
  const validateDate = (y: number, m: number, d: number, h: number, min: number): string | null => {
    // Check if date is valid
    const date = new Date(y, m - 1, d, h, min, 0, 0)
    
    // Check if date components match (e.g., Feb 31 would roll over to Mar 3)
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return 'تاریخ وارد شده نامعتبر است'
    }

    // Check if date is in the past
    if (validatePast) {
      const now = new Date()
      if (includeTime) {
        // For datetime, compare full datetime
        if (date < now) {
          return 'تاریخ و ساعت نباید در گذشته باشد'
        }
      } else {
        // For date only, compare just the date part
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const selectedDate = new Date(y, m - 1, d)
        if (selectedDate < today) {
          return 'تاریخ نباید در گذشته باشد'
        }
      }
    }

    return null
  }

  // Notify parent of changes
  const notifyChange = (y: number, m: number, d: number, h: number, min: number) => {
    const error = validateDate(y, m, d, h, min)
    setValidationError(error || '')
    
    if (!error) {
      const isoString = buildISOString(y, m, d, h, min)
      onChange(isoString)
    }
  }

  // Handlers with circular behavior
  const handleYearChange = (newYear: number) => {
    setYear(newYear)
    notifyChange(newYear, month, day, hour, minute)
  }

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth)
    notifyChange(year, newMonth, day, hour, minute)
  }

  const handleDayChange = (newDay: number) => {
    // Circular behavior: 1-31
    let adjustedDay = newDay
    if (newDay < 1) adjustedDay = 31
    if (newDay > 31) adjustedDay = 1
    
    setDay(adjustedDay)
    notifyChange(year, month, adjustedDay, hour, minute)
  }

  const handleHourChange = (newHour: number) => {
    // Circular behavior: 0-23
    let adjustedHour = newHour
    if (newHour < 0) adjustedHour = 23
    if (newHour > 23) adjustedHour = 0
    
    setHour(adjustedHour)
    notifyChange(year, month, day, adjustedHour, minute)
  }

  const handleMinuteChange = (newMinute: number) => {
    // Circular behavior: 0-59
    let adjustedMinute = newMinute
    if (newMinute < 0) adjustedMinute = 59
    if (newMinute > 59) adjustedMinute = 0
    
    setMinute(adjustedMinute)
    notifyChange(year, month, day, hour, adjustedMinute)
  }

  const inputClassName = cn(
    'px-3 py-2.5 rounded-xl border transition-all',
    'text-neutral-900 text-center',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    {
      'border-neutral-200 focus:border-primary-500 focus:ring-primary-100': !error && !validationError,
      'border-red-300 focus:border-red-500 focus:ring-red-100': error || validationError,
    }
  )

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
        </label>
      )}

      <div className="space-y-3">
        {/* Date fields */}
        <div className="grid grid-cols-3 gap-2">
          {/* Year */}
          <div>
            <label className="block text-xs text-neutral-600 mb-1">سال</label>
            <input
              type="number"
              value={year}
              onChange={(e) => handleYearChange(parseInt(e.target.value) || now.getFullYear())}
              className={inputClassName}
              style={{ width: '100%' }}
            />
          </div>

          {/* Month - Custom Dropdown */}
          <MonthSelect
            value={month}
            onChange={handleMonthChange}
            hasError={!!error || !!validationError}
          />

          {/* Day */}
          <div>
            <label className="block text-xs text-neutral-600 mb-1">روز</label>
            <input
              type="number"
              min="1"
              max="31"
              value={day}
              onChange={(e) => handleDayChange(parseInt(e.target.value) || 1)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  handleDayChange(day >= 31 ? 1 : day + 1)
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  handleDayChange(day <= 1 ? 31 : day - 1)
                }
              }}
              className={inputClassName}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Time fields */}
        {includeTime && (
          <div className="grid grid-cols-2 gap-2">
            {/* Hour */}
            <div>
              <label className="block text-xs text-neutral-600 mb-1">ساعت</label>
              <input
                type="number"
                min="0"
                max="23"
                value={hour.toString().padStart(2, '0')}
                onChange={(e) => handleHourChange(parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    handleHourChange(hour >= 23 ? 0 : hour + 1)
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    handleHourChange(hour <= 0 ? 23 : hour - 1)
                  }
                }}
                className={inputClassName}
                style={{ width: '100%' }}
              />
            </div>

            {/* Minute */}
            <div>
              <label className="block text-xs text-neutral-600 mb-1">دقیقه</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minute.toString().padStart(2, '0')}
                onChange={(e) => handleMinuteChange(parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    handleMinuteChange(minute >= 59 ? 0 : minute + 1)
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    handleMinuteChange(minute <= 0 ? 59 : minute - 1)
                  }
                }}
                className={inputClassName}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </div>

      {(error || validationError) && (
        <p className="mt-1.5 text-sm text-red-600 font-normal">
          {error || validationError}
        </p>
      )}

      {helperText && !error && !validationError && (
        <p className="mt-1.5 text-sm text-neutral-500 font-light">{helperText}</p>
      )}
    </div>
  )
}

