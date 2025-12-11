'use client'

import { cn } from '@/lib/utils'

interface FilterChipProps {
  label: string
  value: string
  onRemove: () => void
  className?: string
}

/**
 * FilterChip - نمایش یک فیلتر فعال به صورت تگ قابل حذف
 */
export default function FilterChip({
  label,
  value,
  onRemove,
  className,
}: FilterChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'bg-primary-100 text-primary-800 text-sm font-medium',
        'transition-all hover:bg-primary-200',
        className
      )}
    >
      <span className="text-primary-600 text-xs">{label}:</span>
      <span>{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          'flex items-center justify-center w-4 h-4 rounded-full',
          'bg-primary-200 hover:bg-primary-300 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
        )}
        aria-label={`حذف فیلتر ${label}`}
      >
        <svg
          className="w-2.5 h-2.5 text-primary-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </span>
  )
}

