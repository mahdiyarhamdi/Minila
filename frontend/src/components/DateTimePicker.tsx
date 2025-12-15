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

// Number input with increment/decrement buttons for mobile
function NumberInput({
  value,
  onChange,
  min,
  max,
  label,
  hasError,
  padZero = false,
}: {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  label: string
  hasError: boolean
  padZero?: boolean
}) {
  const [inputValue, setInputValue] = useState(padZero ? value.toString().padStart(2, '0') : value.toString())
  
  useEffect(() => {
    setInputValue(padZero ? value.toString().padStart(2, '0') : value.toString())
  }, [value, padZero])

  const handleIncrement = () => {
    const newValue = value >= max ? min : value + 1
    onChange(newValue)
  }

  const handleDecrement = () => {
    const newValue = value <= min ? max : value - 1
    onChange(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Allow empty string for editing
    if (newValue === '') return
    
    const parsed = parseInt(newValue, 10)
    if (!isNaN(parsed)) {
      // Clamp value to valid range
      const clamped = Math.max(min, Math.min(max, parsed))
      onChange(clamped)
    }
  }

  const handleBlur = () => {
    // On blur, reset to current value if empty
    if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
      setInputValue(padZero ? value.toString().padStart(2, '0') : value.toString())
    }
  }

  return (
    <div className="min-w-0">
      <label className="block text-xs text-neutral-600 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrement}
          className="flex-shrink-0 w-8 h-10 flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
        >
          <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={cn(
            'flex-1 min-w-0 px-2 py-2.5 border rounded-xl transition-all',
            'text-neutral-900 text-center',
            'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:z-10',
            {
              'border-neutral-200 focus:border-primary-500 focus:ring-primary-100': !hasError,
              'border-red-300 focus:border-red-500 focus:ring-red-100': hasError,
            }
          )}
        />
        <button
          type="button"
          onClick={handleIncrement}
          className="flex-shrink-0 w-8 h-10 flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
        >
          <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Year input - special case with wider range
function YearInput({
  value,
  onChange,
  label,
  hasError,
}: {
  value: number
  onChange: (value: number) => void
  label: string
  hasError: boolean
}) {
  const [inputValue, setInputValue] = useState(value.toString())
  
  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleIncrement = () => {
    onChange(value + 1)
  }

  const handleDecrement = () => {
    onChange(Math.max(2020, value - 1))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    if (newValue === '') return
    
    const parsed = parseInt(newValue, 10)
    if (!isNaN(parsed) && parsed >= 2020 && parsed <= 2100) {
      onChange(parsed)
    }
  }

  const handleBlur = () => {
    if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
      setInputValue(value.toString())
    }
  }

  return (
    <div className="min-w-0">
      <label className="block text-xs text-neutral-600 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrement}
          className="flex-shrink-0 w-8 h-10 flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
        >
          <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={cn(
            'flex-1 min-w-0 px-2 py-2.5 border rounded-xl transition-all',
            'text-neutral-900 text-center',
            'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:z-10',
            {
              'border-neutral-200 focus:border-primary-500 focus:ring-primary-100': !hasError,
              'border-red-300 focus:border-red-500 focus:ring-red-100': hasError,
            }
          )}
        />
        <button
          type="button"
          onClick={handleIncrement}
          className="flex-shrink-0 w-8 h-10 flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
        >
          <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
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
      <label className="block text-xs text-neutral-600 mb-1">Month</label>
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
      return 'Invalid date'
    }

    // Check if date is in the past
    if (validatePast) {
      const now = new Date()
      if (includeTime) {
        // For datetime, compare full datetime
        if (date < now) {
          return 'Date and time cannot be in the past'
        }
      } else {
        // For date only, compare just the date part
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const selectedDate = new Date(y, m - 1, d)
        if (selectedDate < today) {
          return 'Date cannot be in the past'
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

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
        </label>
      )}

      <div className="space-y-3">
        {/* Year - Always full width on separate row */}
        <YearInput
          value={year}
          onChange={handleYearChange}
          label="Year"
          hasError={!!error || !!validationError}
        />

        {/* Month & Day */}
        <div className="grid grid-cols-2 gap-2">
          {/* Month - Custom Dropdown */}
          <MonthSelect
            value={month}
            onChange={handleMonthChange}
            hasError={!!error || !!validationError}
          />

          {/* Day */}
          <NumberInput
            value={day}
            onChange={handleDayChange}
            min={1}
            max={31}
            label="Day"
            hasError={!!error || !!validationError}
          />
        </div>

        {/* Time fields */}
        {includeTime && (
          <div className="grid grid-cols-2 gap-2">
            {/* Hour */}
            <NumberInput
              value={hour}
              onChange={handleHourChange}
              min={0}
              max={23}
              label="Hour"
              hasError={!!error || !!validationError}
              padZero
            />

            {/* Minute */}
            <NumberInput
              value={minute}
              onChange={handleMinuteChange}
              min={0}
              max={59}
              label="Minute"
              hasError={!!error || !!validationError}
              padZero
            />
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

