'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface SparklineChartProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fillColor?: string
  showFill?: boolean
  showDot?: boolean
  strokeWidth?: number
  className?: string
}

export default function SparklineChart({
  data,
  width = 80,
  height = 30,
  color = '#00A8E8',
  fillColor,
  showFill = true,
  showDot = true,
  strokeWidth = 1.5,
  className,
}: SparklineChartProps) {
  const { path, areaPath, lastPoint } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: '', areaPath: '', lastPoint: null }
    }

    const padding = 2
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const maxValue = Math.max(...data, 1)
    const minValue = Math.min(...data, 0)
    const range = maxValue - minValue || 1

    const points = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * chartWidth,
      y: padding + ((maxValue - value) / range) * chartHeight,
    }))

    // Create smooth path
    let linePath = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const tension = 0.2
      
      const cp1x = prev.x + (curr.x - prev.x) * tension
      const cp1y = prev.y
      const cp2x = curr.x - (curr.x - prev.x) * tension
      const cp2y = curr.y
      
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
    }

    // Area path
    const bottomY = height - padding
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`

    return { 
      path: linePath, 
      areaPath,
      lastPoint: points[points.length - 1]
    }
  }, [data, width, height])

  if (!data || data.length < 2) {
    return (
      <div 
        className={cn("flex items-center justify-center text-neutral-300", className)}
        style={{ width, height }}
      >
        <span className="text-xs">—</span>
      </div>
    )
  }

  // Determine trend
  const isPositive = data[data.length - 1] >= data[0]
  const trendColor = color || (isPositive ? '#10B981' : '#EF4444')
  const gradient = fillColor || trendColor

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={cn("overflow-visible", className)}
      style={{ width, height }}
    >
      <defs>
        <linearGradient id={`sparkline-gradient-${trendColor.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={gradient} stopOpacity="0.3" />
          <stop offset="100%" stopColor={gradient} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Fill area */}
      {showFill && (
        <path
          d={areaPath}
          fill={`url(#sparkline-gradient-${trendColor.replace('#', '')})`}
        />
      )}

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={trendColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Last point dot */}
      {showDot && lastPoint && (
        <>
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="3"
            fill={trendColor}
            opacity="0.2"
            className="animate-pulse"
          />
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="2"
            fill="white"
            stroke={trendColor}
            strokeWidth="1.5"
          />
        </>
      )}
    </svg>
  )
}

