'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
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
  datasetLabel: string
  color: string
  index: number
}

interface AdvancedLineChartProps {
  labels: string[]
  datasets: Dataset[]
  height?: number
  showLabels?: boolean
  title?: string
  xAxisLabel?: string
  yAxisLabel?: string
  showTooltip?: boolean
  showGradient?: boolean
  showLastValue?: boolean
  animate?: boolean
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return Math.round(num).toLocaleString('fa-IR')
}

const formatDate = (dateStr: string): string => {
  const parts = dateStr.split('-')
  if (parts.length >= 3) {
    return `${parts[1]}/${parts[2]}`
  }
  return dateStr
}

export default function AdvancedLineChart({
  labels,
  datasets,
  height = 280,
  showLabels = true,
  title,
  xAxisLabel = 'تاریخ',
  yAxisLabel = 'تعداد',
  showTooltip = true,
  showGradient = true,
  showLastValue = true,
  animate = true,
}: AdvancedLineChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [hoveredDataset, setHoveredDataset] = useState<number | null>(null)
  const [chartWidth, setChartWidth] = useState(600)
  const containerRef = useRef<HTMLDivElement>(null)

  const defaultColors = ['#00A8E8', '#E5C189', '#10B981', '#F59E0B', '#8B5CF6']

  // Observe container width
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setChartWidth(entry.contentRect.width - 60) // subtract padding for y-axis
      }
    })
    
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Calculate chart dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 10 }
  const chartHeight = height - padding.top - padding.bottom

  // Calculate value range
  const { maxValue, minValue } = useMemo(() => {
    if (!datasets.length || !datasets[0]?.data?.length) {
      return { maxValue: 1, minValue: 0 }
    }
    const allValues = datasets.flatMap(d => d.data)
    const max = Math.max(...allValues, 1)
    const min = Math.min(...allValues, 0)
    // Round up max to nice number
    const niceMax = Math.ceil(max * 1.1)
    return { maxValue: niceMax, minValue: Math.min(min, 0) }
  }, [datasets])

  const range = maxValue - minValue || 1

  // Generate Y-axis ticks (only integers)
  const yTicks = useMemo(() => {
    const tickCount = 5
    const rawStep = range / (tickCount - 1)
    const step = Math.ceil(rawStep) || 1
    const ticks = []
    for (let i = 0; i < tickCount; i++) {
      ticks.push(minValue + step * i)
    }
    return ticks.reverse()
  }, [range, minValue])

  // Generate points for each dataset (pixel coordinates)
  const getPoints = useCallback((data: number[]) => {
    if (data.length === 0 || chartWidth <= 0) return []
    const usableWidth = chartWidth - padding.left - padding.right
    return data.map((value, index) => {
      const x = padding.left + (data.length === 1 ? usableWidth / 2 : (index / (data.length - 1)) * usableWidth)
      const y = padding.top + ((maxValue - value) / range) * chartHeight
      return { x, y, value }
    })
  }, [chartWidth, chartHeight, maxValue, range])

  // Create smooth path using bezier curves
  const createSmoothPath = useCallback((points: { x: number; y: number }[]) => {
    if (points.length < 2) return points.length === 1 ? `M ${points[0].x} ${points[0].y}` : ''
    
    let path = `M ${points[0].x} ${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const tension = 0.3
      
      const cp1x = prev.x + (curr.x - prev.x) * tension
      const cp1y = prev.y
      const cp2x = curr.x - (curr.x - prev.x) * tension
      const cp2y = curr.y
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
    }
    
    return path
  }, [])

  // Create area path for gradient fill
  const createAreaPath = useCallback((points: { x: number; y: number }[]) => {
    if (points.length < 2) return ''
    const linePath = createSmoothPath(points)
    const bottomY = padding.top + chartHeight
    return `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`
  }, [createSmoothPath, chartHeight])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip || !datasets.length) return
    
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    
    // Find closest point across all datasets
    let closestPoint: TooltipData | null = null
    let closestDist = Infinity
    
    datasets.forEach((dataset, datasetIndex) => {
      const points = getPoints(dataset.data)
      points.forEach((point, pointIndex) => {
        const dist = Math.abs(point.x - mouseX)
        if (dist < closestDist && dist < 30) {
          closestDist = dist
          closestPoint = {
            x: point.x,
            y: point.y,
            label: labels[pointIndex],
            value: point.value,
            datasetLabel: dataset.label,
            color: dataset.color || defaultColors[datasetIndex % defaultColors.length],
            index: pointIndex,
          }
        }
      })
    })
    
    setTooltip(closestPoint)
  }, [showTooltip, datasets, labels, getPoints, defaultColors])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
    setHoveredDataset(null)
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 relative">
      {title && (
        <h3 className="font-semibold text-neutral-800 mb-6 text-lg">{title}</h3>
      )}

      {/* Legend */}
      {datasets.length > 1 && (
        <div className="flex flex-wrap gap-4 mb-6">
          {datasets.map((dataset, index) => (
            <div 
              key={dataset.label} 
              className={cn(
                "flex items-center gap-2 cursor-pointer transition-opacity",
                hoveredDataset !== null && hoveredDataset !== index && "opacity-40"
              )}
              onMouseEnter={() => setHoveredDataset(index)}
              onMouseLeave={() => setHoveredDataset(null)}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dataset.color || defaultColors[index % defaultColors.length] }}
              />
              <span className="text-sm text-neutral-600">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart Container */}
      <div ref={containerRef} className="relative" style={{ height }}>
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
          width={chartWidth}
          height={height}
          className="mr-auto ml-14"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {datasets.map((dataset, index) => {
              const color = dataset.color || defaultColors[index % defaultColors.length]
              return (
                <linearGradient 
                  key={`gradient-${index}`} 
                  id={`line-gradient-${index}`} 
                  x1="0%" 
                  y1="0%" 
                  x2="0%" 
                  y2="100%"
                >
                  <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.02" />
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
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#F3F4F6"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            )
          })}

          {/* Datasets */}
          {datasets.map((dataset, datasetIndex) => {
            const points = getPoints(dataset.data)
            const linePath = createSmoothPath(points)
            const areaPath = createAreaPath(points)
            const color = dataset.color || defaultColors[datasetIndex % defaultColors.length]
            const isHovered = hoveredDataset === null || hoveredDataset === datasetIndex

            return (
              <g 
                key={dataset.label}
                className={cn(
                  "transition-opacity duration-200",
                  !isHovered && "opacity-30"
                )}
              >
                {/* Gradient area */}
                {showGradient && (
                  <path
                    d={areaPath}
                    fill={`url(#line-gradient-${datasetIndex})`}
                  />
                )}

                {/* Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points */}
                {points.map((point, pointIndex) => (
                  <g key={pointIndex}>
                    {/* Outer ring on hover */}
                    {tooltip?.index === pointIndex && tooltip?.datasetLabel === dataset.label && (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="8"
                        fill={color}
                        fillOpacity="0.2"
                      />
                    )}
                    {/* Main point */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={tooltip?.index === pointIndex && tooltip?.datasetLabel === dataset.label ? 5 : 4}
                      fill="white"
                      stroke={color}
                      strokeWidth="2"
                    />
                  </g>
                ))}

                {/* Last value label */}
                {showLastValue && points.length > 0 && (
                  <g>
                    <rect
                      x={points[points.length - 1].x + 8}
                      y={points[points.length - 1].y - 10}
                      width="32"
                      height="20"
                      rx="4"
                      fill={color}
                      fillOpacity="0.15"
                    />
                    <text
                      x={points[points.length - 1].x + 24}
                      y={points[points.length - 1].y + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill={color}
                    >
                      {formatNumber(points[points.length - 1].value)}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Vertical hover line */}
          {tooltip && (
            <line
              x1={tooltip.x}
              y1={padding.top}
              x2={tooltip.x}
              y2={padding.top + chartHeight}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div 
            className="absolute z-10 pointer-events-none transform -translate-x-1/2"
            style={{ 
              left: tooltip.x + 56, 
              top: tooltip.y - 50,
            }}
          >
            <div className="bg-neutral-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
              <div className="text-neutral-400 text-xs mb-1">{formatDate(tooltip.label)}</div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tooltip.color }}
                />
                <span className="font-semibold">{tooltip.value.toLocaleString('fa-IR')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      {showLabels && labels.length > 0 && (
        <div className="flex justify-between mt-3 text-xs text-neutral-400 px-14">
          {labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0).map((label, index) => (
            <span key={index}>{formatDate(label)}</span>
          ))}
        </div>
      )}

      {/* X-axis title */}
      <div className="text-center mt-2 text-xs font-medium text-neutral-400">
        {xAxisLabel}
      </div>
    </div>
  )
}
