'use client'

import { cn } from '@/lib/utils'

interface TrendIndicatorProps {
  value: number // Percentage change
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export default function TrendIndicator({
  value,
  label,
  size = 'md',
  showIcon = true,
  className,
}: TrendIndicatorProps) {
  const isPositive = value >= 0
  const isNeutral = value === 0

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const colorClasses = isNeutral
    ? 'text-neutral-500'
    : isPositive
    ? 'text-emerald-600'
    : 'text-red-500'

  const bgClasses = isNeutral
    ? 'bg-neutral-50'
    : isPositive
    ? 'bg-emerald-50'
    : 'bg-red-50'

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
      bgClasses,
      sizeClasses[size],
      className
    )}>
      {showIcon && (
        <span className={cn("flex-shrink-0", colorClasses)}>
          {isNeutral ? (
            <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          ) : isPositive ? (
            <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </span>
      )}
      <span className={cn("font-semibold", colorClasses)}>
        {Math.abs(value).toFixed(1)}%
      </span>
      {label && (
        <span className="text-neutral-500 font-normal">{label}</span>
      )}
    </div>
  )
}

