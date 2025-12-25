'use client'

import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Dataset {
  label: string
  data: number[]
  color?: string
}

interface TooltipData {
  x: number
  y: number
  label: string
  value: number
  prevValue?: number
  datasetLabel: string
  color: string
}

interface AdvancedBarChartProps {
  labels: string[]
  datasets: Dataset[]
  height?: number
  title?: string
  stacked?: boolean
  showTooltip?: boolean
  showComparison?: boolean
  animate?: boolean
  xAxisLabel?: string
  yAxisLabel?: string
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString('fa-IR')
}

const formatDate = (dateStr: string): string => {
  const parts = dateStr.split('-')
  if (parts.length >= 3) {
    return `${parts[1]}/${parts[2]}`
  }
  return dateStr
}

export default function AdvancedBarChart({
  labels,
  datasets,
  height = 280,
  title,
  stacked = false,
  showTooltip = true,
  showComparison = true,
  animate = true,
  xAxisLabel = 'تاریخ',
  yAxisLabel = 'تعداد',
}: AdvancedBarChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [hoveredBar, setHoveredBar] = useState<{ labelIndex: number; datasetIndex: number } | null>(null)

  const defaultColors = ['#00A8E8', '#E5C189', '#10B981', '#F59E0B', '#8B5CF6']

  const padding = { top: 20, right: 20, bottom: 50, left: 50 }
  const chartHeight = height - padding.top - padding.bottom

  // Calculate max value
  const maxValue = useMemo(() => {
    if (!datasets.length || !datasets[0]?.data?.length) return 1
    if (stacked) {
      return Math.max(
        ...labels.map((_, i) => 
          datasets.reduce((sum, d) => sum + (d.data[i] || 0), 0)
        ),
        1
      )
    }
    return Math.max(...datasets.flatMap(d => d.data), 1)
  }, [datasets, labels, stacked])

  // Generate Y-axis ticks
  const yTicks = useMemo(() => {
    const tickCount = 5
    const step = maxValue / (tickCount - 1)
    return Array.from({ length: tickCount }, (_, i) => step * i).reverse()
  }, [maxValue])

  const barWidth = useMemo(() => {
    const totalBars = stacked ? 1 : datasets.length
    const availableWidth = 80 / labels.length
    return Math.min(availableWidth * 0.7 / totalBars, 8)
  }, [stacked, datasets.length, labels.length])

  const handleBarHover = useCallback((
    e: React.MouseEvent,
    labelIndex: number,
    datasetIndex: number,
    value: number,
  ) => {
    if (!showTooltip) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const parentRect = (e.currentTarget.closest('svg') as SVGElement)?.getBoundingClientRect()
    
    const dataset = datasets[datasetIndex]
    const prevValue = labelIndex > 0 ? dataset.data[labelIndex - 1] : undefined
    
    setTooltip({
      x: rect.left - (parentRect?.left || 0) + rect.width / 2,
      y: rect.top - (parentRect?.top || 0),
      label: labels[labelIndex],
      value,
      prevValue,
      datasetLabel: dataset.label,
      color: dataset.color || defaultColors[datasetIndex % defaultColors.length],
    })
    setHoveredBar({ labelIndex, datasetIndex })
  }, [showTooltip, datasets, labels, defaultColors])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
    setHoveredBar(null)
  }, [])

  if (!datasets.length || !datasets[0]?.data?.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
        {title && <h3 className="font-semibold text-neutral-900 mb-4">{title}</h3>}
        <div className="h-48 flex items-center justify-center text-neutral-400">
          داده‌ای برای نمایش وجود ندارد
        </div>
      </div>
    )
  }

  const getChangePercent = (current: number, prev: number | undefined): { value: number; isPositive: boolean } | null => {
    if (prev === undefined || prev === 0) return null
    const change = ((current - prev) / prev) * 100
    return { value: Math.abs(change), isPositive: change >= 0 }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 relative">
      {title && (
        <h3 className="font-semibold text-neutral-800 mb-6 text-lg">{title}</h3>
      )}

      {/* Legend */}
      {datasets.length > 1 && (
        <div className="flex flex-wrap gap-4 mb-6">
          {datasets.map((dataset, index) => (
            <div key={dataset.label} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: dataset.color || defaultColors[index % defaultColors.length] }}
              />
              <span className="text-sm text-neutral-600">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart Container */}
      <div className="relative" style={{ height }}>
        {/* Y-axis label */}
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-neutral-400 whitespace-nowrap">
          {yAxisLabel}
        </div>

        {/* Y-axis ticks */}
        <div className="absolute left-6 top-0 h-full flex flex-col justify-between py-5 text-xs text-neutral-400">
          {yTicks.map((tick, i) => (
            <span key={i} className="text-left w-8">{formatNumber(tick)}</span>
          ))}
        </div>

        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full ml-10"
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {datasets.map((dataset, index) => {
              const color = dataset.color || defaultColors[index % defaultColors.length]
              return (
                <linearGradient 
                  key={`bar-gradient-${index}`} 
                  id={`bar-gradient-${index}`} 
                  x1="0%" 
                  y1="0%" 
                  x2="0%" 
                  y2="100%"
                >
                  <stop offset="0%" stopColor={color} stopOpacity="1" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                </linearGradient>
              )
            })}
          </defs>

          {/* Grid lines */}
          {yTicks.map((_, i) => {
            const y = padding.top + (i / (yTicks.length - 1)) * chartHeight
            return (
              <line
                key={i}
                x1="5"
                y1={y}
                x2="95"
                y2={y}
                stroke="#F3F4F6"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
            )
          })}

          {/* Bars */}
          {labels.map((label, labelIndex) => {
            const groupWidth = 85 / labels.length
            const groupX = 7.5 + labelIndex * groupWidth + groupWidth / 2

            if (stacked) {
              let currentY = height - padding.bottom
              return (
                <g key={labelIndex}>
                  {datasets.map((dataset, datasetIndex) => {
                    const value = dataset.data[labelIndex] || 0
                    const barHeight = (value / maxValue) * chartHeight
                    const color = dataset.color || defaultColors[datasetIndex % defaultColors.length]
                    const isHovered = hoveredBar?.labelIndex === labelIndex && hoveredBar?.datasetIndex === datasetIndex

                    const rect = (
                      <rect
                        key={datasetIndex}
                        x={groupX - barWidth / 2}
                        y={currentY - barHeight}
                        width={barWidth}
                        height={Math.max(barHeight, 0)}
                        fill={`url(#bar-gradient-${datasetIndex})`}
                        rx="1.5"
                        className={cn(
                          "cursor-pointer transition-all duration-200",
                          isHovered && "filter brightness-110",
                          animate && "animate-grow-up"
                        )}
                        style={{
                          transformOrigin: 'bottom',
                          animationDelay: animate ? `${labelIndex * 30}ms` : undefined,
                        }}
                        onMouseEnter={(e) => handleBarHover(e, labelIndex, datasetIndex, value)}
                      />
                    )
                    currentY -= barHeight
                    return rect
                  })}
                </g>
              )
            } else {
              const totalWidth = datasets.length * barWidth + (datasets.length - 1) * 1
              const startX = groupX - totalWidth / 2

              return (
                <g key={labelIndex}>
                  {datasets.map((dataset, datasetIndex) => {
                    const value = dataset.data[labelIndex] || 0
                    const barHeight = (value / maxValue) * chartHeight
                    const isHovered = hoveredBar?.labelIndex === labelIndex && hoveredBar?.datasetIndex === datasetIndex
                    const barX = startX + datasetIndex * (barWidth + 1)

                    return (
                      <rect
                        key={datasetIndex}
                        x={barX}
                        y={height - padding.bottom - barHeight}
                        width={barWidth}
                        height={Math.max(barHeight, 0)}
                        fill={`url(#bar-gradient-${datasetIndex})`}
                        rx="1.5"
                        className={cn(
                          "cursor-pointer transition-all duration-200",
                          isHovered && "filter brightness-110",
                          animate && "animate-grow-up"
                        )}
                        style={{
                          transformOrigin: 'bottom',
                          animationDelay: animate ? `${labelIndex * 30}ms` : undefined,
                        }}
                        onMouseEnter={(e) => handleBarHover(e, labelIndex, datasetIndex, value)}
                      />
                    )
                  })}
                </g>
              )
            }
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div 
            className="absolute z-10 pointer-events-none"
            style={{ 
              left: tooltip.x, 
              top: tooltip.y - 10,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="bg-neutral-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm min-w-[120px]">
              <div className="text-neutral-400 text-xs mb-1">{formatDate(tooltip.label)}</div>
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-2 h-2 rounded"
                  style={{ backgroundColor: tooltip.color }}
                />
                <span className="font-semibold">{tooltip.value.toLocaleString('fa-IR')}</span>
              </div>
              
              {/* Comparison with previous */}
              {showComparison && tooltip.prevValue !== undefined && (
                <div className="text-xs border-t border-neutral-700 pt-1 mt-1">
                  {(() => {
                    const change = getChangePercent(tooltip.value, tooltip.prevValue)
                    if (!change) return null
                    return (
                      <span className={change.isPositive ? 'text-emerald-400' : 'text-red-400'}>
                        {change.isPositive ? '↑' : '↓'} {change.value.toFixed(1)}% نسبت به قبل
                      </span>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      {labels.length <= 14 && (
        <div className="flex justify-between mt-3 text-xs text-neutral-400 px-10">
          {labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0).map((label, index) => (
            <span key={index}>{formatDate(label)}</span>
          ))}
        </div>
      )}

      {/* X-axis title */}
      <div className="text-center mt-2 text-xs font-medium text-neutral-400">
        {xAxisLabel}
      </div>

      <style jsx>{`
        @keyframes grow-up {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }
        .animate-grow-up {
          animation: grow-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

