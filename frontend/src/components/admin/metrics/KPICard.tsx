'use client'

import { cn } from '@/lib/utils'
import { SparklineChart } from '../charts'
import TrendIndicator from './TrendIndicator'

interface KPICardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  trend?: {
    value: number
    label?: string
  }
  sparklineData?: number[]
  description?: string
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const colorConfig = {
  primary: {
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    sparklineColor: '#00A8E8',
    gradientFrom: 'from-primary-50',
  },
  success: {
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    sparklineColor: '#10B981',
    gradientFrom: 'from-emerald-50',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    sparklineColor: '#F59E0B',
    gradientFrom: 'from-amber-50',
  },
  error: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    sparklineColor: '#EF4444',
    gradientFrom: 'from-red-50',
  },
  neutral: {
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-600',
    sparklineColor: '#6B7280',
    gradientFrom: 'from-neutral-50',
  },
}

export default function KPICard({
  title,
  value,
  icon,
  trend,
  sparklineData,
  description,
  color = 'primary',
  size = 'md',
  className,
}: KPICardProps) {
  const config = colorConfig[color]

  const sizeClasses = {
    sm: {
      card: 'p-4',
      title: 'text-xs',
      value: 'text-xl',
      icon: 'w-10 h-10',
      sparkline: { width: 60, height: 24 },
    },
    md: {
      card: 'p-5',
      title: 'text-sm',
      value: 'text-2xl',
      icon: 'w-12 h-12',
      sparkline: { width: 80, height: 32 },
    },
    lg: {
      card: 'p-6',
      title: 'text-base',
      value: 'text-3xl',
      icon: 'w-14 h-14',
      sparkline: { width: 100, height: 40 },
    },
  }

  const sizes = sizeClasses[size]

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-sm border border-neutral-100 relative overflow-hidden group hover:shadow-md transition-all duration-200",
      sizes.card,
      className
    )}>
      {/* Subtle gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br to-transparent opacity-50",
        config.gradientFrom
      )} />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className={cn("font-medium text-neutral-500 mb-1", sizes.title)}>
              {title}
            </p>
            <p className={cn("font-bold text-neutral-900", sizes.value)}>
              {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
            </p>
          </div>
          
          <div className={cn(
            "rounded-xl flex items-center justify-center flex-shrink-0",
            config.iconBg,
            config.iconColor,
            sizes.icon
          )}>
            {icon}
          </div>
        </div>

        {/* Sparkline or Trend */}
        <div className="flex items-center justify-between mt-4">
          {sparklineData && sparklineData.length > 1 && (
            <SparklineChart
              data={sparklineData}
              width={sizes.sparkline.width}
              height={sizes.sparkline.height}
              color={config.sparklineColor}
            />
          )}
          
          {trend && (
            <TrendIndicator
              value={trend.value}
              label={trend.label}
              size={size === 'lg' ? 'md' : 'sm'}
            />
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-neutral-400 mt-2">{description}</p>
        )}
      </div>
    </div>
  )
}

