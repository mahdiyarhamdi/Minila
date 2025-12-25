'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface PieDataItem {
  label: string
  value: number
  color?: string
}

interface AdvancedPieChartProps {
  data: PieDataItem[]
  size?: number
  title?: string
  showLegend?: boolean
  showLabels?: boolean
  animate?: boolean
  donutWidth?: number
}

const defaultColors = ['#00A8E8', '#E5C189', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function AdvancedPieChart({
  data,
  size = 220,
  title,
  showLegend = true,
  showLabels = true,
  animate = true,
  donutWidth = 45,
}: AdvancedPieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data])

  const slices = useMemo(() => {
    if (total === 0) return []
    
    let currentAngle = -90
    return data.map((item, index) => {
      const percentage = (item.value / total) * 100
      const angle = (item.value / total) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle

      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      const cx = size / 2
      const cy = size / 2
      const outerRadius = size / 2 - 10
      const innerRadius = outerRadius - donutWidth

      // Outer arc points
      const x1 = cx + outerRadius * Math.cos(startRad)
      const y1 = cy + outerRadius * Math.sin(startRad)
      const x2 = cx + outerRadius * Math.cos(endRad)
      const y2 = cy + outerRadius * Math.sin(endRad)

      // Inner arc points
      const x3 = cx + innerRadius * Math.cos(endRad)
      const y3 = cy + innerRadius * Math.sin(endRad)
      const x4 = cx + innerRadius * Math.cos(startRad)
      const y4 = cy + innerRadius * Math.sin(startRad)

      const largeArcFlag = angle > 180 ? 1 : 0

      // Donut path
      const pathData = [
        `M ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z',
      ].join(' ')

      // Label position (middle of the slice, outside)
      const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180)
      const labelRadius = outerRadius + 25
      const labelX = cx + labelRadius * Math.cos(midAngle)
      const labelY = cy + labelRadius * Math.sin(midAngle)

      // Connector line points
      const lineStartRadius = outerRadius + 5
      const lineMidRadius = outerRadius + 15
      const lineStartX = cx + lineStartRadius * Math.cos(midAngle)
      const lineStartY = cy + lineStartRadius * Math.sin(midAngle)
      const lineMidX = cx + lineMidRadius * Math.cos(midAngle)
      const lineMidY = cy + lineMidRadius * Math.sin(midAngle)

      return {
        ...item,
        pathData,
        percentage,
        color: item.color || defaultColors[index % defaultColors.length],
        labelX,
        labelY,
        lineStartX,
        lineStartY,
        lineMidX,
        lineMidY,
        midAngle,
        index,
      }
    })
  }, [data, total, size, donutWidth])

  if (total === 0) {
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
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
      {title && (
        <h3 className="font-semibold text-neutral-800 mb-6 text-lg">{title}</h3>
      )}

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Pie Chart */}
        <div className="relative" style={{ width: size + 60, height: size + 60 }}>
          <svg 
            viewBox={`-30 -30 ${size + 60} ${size + 60}`} 
            className="w-full h-full"
          >
            {/* Slices */}
            {slices.map((slice, index) => {
              const isHovered = hoveredIndex === index
              const scale = isHovered ? 1.05 : 1
              const translateX = isHovered ? Math.cos(slice.midAngle) * 5 : 0
              const translateY = isHovered ? Math.sin(slice.midAngle) * 5 : 0

              return (
                <g key={index}>
                  <path
                    d={slice.pathData}
                    fill={slice.color}
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      isHovered && "filter drop-shadow-lg"
                    )}
                    style={{
                      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                      transformOrigin: `${size / 2}px ${size / 2}px`,
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* Label connector line */}
                  {showLabels && slice.percentage > 5 && (
                    <>
                      <line
                        x1={slice.lineStartX}
                        y1={slice.lineStartY}
                        x2={slice.lineMidX}
                        y2={slice.lineMidY}
                        stroke={slice.color}
                        strokeWidth="1"
                        opacity="0.6"
                      />
                      <line
                        x1={slice.lineMidX}
                        y1={slice.lineMidY}
                        x2={slice.labelX}
                        y2={slice.lineMidY}
                        stroke={slice.color}
                        strokeWidth="1"
                        opacity="0.6"
                      />
                    </>
                  )}

                  {/* Label */}
                  {showLabels && slice.percentage > 5 && (
                    <text
                      x={slice.labelX}
                      y={slice.lineMidY}
                      textAnchor={slice.midAngle > -Math.PI / 2 && slice.midAngle < Math.PI / 2 ? "start" : "end"}
                      className="text-[10px] font-medium fill-neutral-600"
                      dy="3"
                    >
                      {slice.percentage.toFixed(1)}%
                    </text>
                  )}
                </g>
              )
            })}

            {/* Center text */}
            <g>
              <text
                x={size / 2}
                y={size / 2 - 8}
                textAnchor="middle"
                className="text-[22px] font-bold fill-neutral-900"
              >
                {total.toLocaleString('fa-IR')}
              </text>
              <text
                x={size / 2}
                y={size / 2 + 12}
                textAnchor="middle"
                className="text-[11px] fill-neutral-400"
              >
                مجموع
              </text>
            </g>
          </svg>

          {/* Animated circle on mount */}
          {animate && (
            <svg 
              viewBox={`0 0 ${size} ${size}`}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ marginLeft: 30, marginTop: 30 }}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 10 - donutWidth / 2}
                fill="none"
                stroke="white"
                strokeWidth={donutWidth + 5}
                className="animate-reveal"
                style={{
                  strokeDasharray: `${Math.PI * (size - 20 - donutWidth)}`,
                  strokeDashoffset: 0,
                }}
              />
            </svg>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-col gap-3 min-w-[160px]">
            {slices.map((slice, index) => {
              const isHovered = hoveredIndex === index
              return (
                <div 
                  key={index} 
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer",
                    isHovered ? "bg-neutral-100" : "hover:bg-neutral-50"
                  )}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 transition-transform"
                    style={{ 
                      backgroundColor: slice.color,
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-neutral-700 block truncate">{slice.label}</span>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <span className="text-sm font-semibold text-neutral-900 block">
                      {slice.value.toLocaleString('fa-IR')}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {slice.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes reveal {
          from {
            stroke-dashoffset: ${Math.PI * (size - 20 - donutWidth)};
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-reveal {
          animation: reveal 1s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

