'use client'

import { useState, useEffect, useRef } from 'react'
import { cn, convertToEnglishNumbers } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'

interface DateTimePickerProps {
  label?: string
  value?: string // ISO datetime string
  onChange: (value: string) => void
  includeTime?: boolean // default: true
  error?: string
  helperText?: string
  validatePast?: boolean // اگر true، تاریخ‌های گذشته invalid هستند
}

// Number picker using native select (avoids keyboard issues on mobile)
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
  // Generate options from min to max
  const options = []
  for (let i = min; i <= max; i++) {
    options.push(i)
  }

  return (
    <div className="min-w-0">
      <label className="block text-xs text-neutral-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className={cn(
          'w-full px-3 py-2.5 border rounded-xl transition-all appearance-none',
          'text-neutral-900 text-center bg-white',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          {
            'border-neutral-200 focus:border-primary-500 focus:ring-primary-100': !hasError,
            'border-red-300 focus:border-red-500 focus:ring-red-100': hasError,
          }
        )}
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {padZero ? opt.toString().padStart(2, '0') : opt}
          </option>
        ))}
      </select>
    </div>
  )
}

// Year picker using native select
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
  const currentYear = new Date().getFullYear()
  const years = []
  // From current year to 5 years in the future
  for (let i = currentYear; i <= currentYear + 5; i++) {
    years.push(i)
  }

  return (
    <div className="min-w-0">
      <label className="block text-xs text-neutral-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className={cn(
          'w-full px-3 py-2.5 border rounded-xl transition-all appearance-none',
          'text-neutral-900 text-center bg-white',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          {
            'border-neutral-200 focus:border-primary-500 focus:ring-primary-100': !hasError,
            'border-red-300 focus:border-red-500 focus:ring-red-100': hasError,
          }
        )}
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
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
  label,
}: {
  value: number
  onChange: (month: number) => void
  hasError: boolean
  label: string
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
      <label className="block text-xs text-neutral-600 mb-1">{label}</label>
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
  const { t } = useTranslation()
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

      <div className="space-y-3" dir="ltr">
        {/* Year - Always full width on separate row */}
        <YearInput
          value={year}
          onChange={handleYearChange}
          label={t('common.dateTime.year')}
          hasError={!!error || !!validationError}
        />

        {/* Month & Day */}
        <div className="grid grid-cols-2 gap-2">
          {/* Month - Custom Dropdown */}
          <MonthSelect
            value={month}
            onChange={handleMonthChange}
            hasError={!!error || !!validationError}
            label={t('common.dateTime.month')}
          />

          {/* Day */}
          <NumberInput
            value={day}
            onChange={handleDayChange}
            min={1}
            max={31}
            label={t('common.dateTime.day')}
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
              label={t('common.dateTime.hour')}
              hasError={!!error || !!validationError}
              padZero
            />

            {/* Minute */}
            <NumberInput
              value={minute}
              onChange={handleMinuteChange}
              min={0}
              max={59}
              label={t('common.dateTime.minute')}
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

