'use client'

import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  description?: string
}

const colorClasses = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'bg-primary-100 text-primary-600',
    text: 'text-primary-600',
  },
  success: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    icon: 'bg-yellow-100 text-yellow-600',
    text: 'text-yellow-600',
  },
  error: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-600',
  },
  neutral: {
    bg: 'bg-neutral-50',
    icon: 'bg-neutral-100 text-neutral-600',
    text: 'text-neutral-600',
  },
}

export default function StatsCard({
  title,
  value,
  icon,
  change,
  color = 'primary',
  description,
}: StatsCardProps) {
  const colors = colorClasses[color]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-neutral-900">
            {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
          </p>
          
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {change.type === 'increase' ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span className={cn(
                "text-sm font-medium",
                change.type === 'increase' ? 'text-green-600' : 'text-red-600'
              )}>
                {change.value}%
              </span>
              <span className="text-xs text-neutral-500">نسبت به هفته قبل</span>
            </div>
          )}
          
          {description && (
            <p className="text-xs text-neutral-500 mt-2">{description}</p>
          )}
        </div>
        
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          colors.icon
        )}>
          {icon}
        </div>
      </div>
    </div>
  )
}

