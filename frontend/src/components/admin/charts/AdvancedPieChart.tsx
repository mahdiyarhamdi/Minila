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
  animate?: boolean
  donutWidth?: number
}

const defaultColors = ['#00A8E8', '#E5C189', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function AdvancedPieChart({
  data,
  size = 200,
  title,
  showLegend = true,
  animate = true,
  donutWidth = 40,
}: AdvancedPieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data])

  const slices = useMemo(() => {
    if (total === 0) return []
    
    let currentAngle = -90 // Start from top
    return data.map((item, index) => {
      const percentage = (item.value / total) * 100
      const angle = (item.value / total) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle

      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180
      const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180)

      const cx = size / 2
      const cy = size / 2
      const outerRadius = size / 2 - 5
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

      return {
        ...item,
        pathData,
        percentage,
        color: item.color || defaultColors[index % defaultColors.length],
        midAngle,
        index,
        cx,
        cy,
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
        {/* Legend - RTL: Legend first */}
        {showLegend && (
          <div className="flex flex-col gap-3 min-w-[140px] order-2 md:order-1">
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
                  <span className="text-sm text-neutral-700 flex-1">{slice.label}</span>
                  <div className="text-left flex-shrink-0">
                    <span className="text-sm font-bold text-neutral-900 block">
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

        {/* Pie Chart */}
        <div 
          className="relative order-1 md:order-2 flex-shrink-0" 
          style={{ width: size, height: size }}
        >
          <svg 
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="block"
          >
            {/* Slices */}
            {slices.map((slice, index) => {
              const isHovered = hoveredIndex === index
              const scale = isHovered ? 1.03 : 1
              const translateX = isHovered ? Math.cos(slice.midAngle) * 3 : 0
              const translateY = isHovered ? Math.sin(slice.midAngle) * 3 : 0

              return (
                <path
                  key={index}
                  d={slice.pathData}
                  fill={slice.color}
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    isHovered && "filter drop-shadow-lg"
                  )}
                  style={{
                    transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                    transformOrigin: `${slice.cx}px ${slice.cy}px`,
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              )
            })}

            {/* Center text */}
            <text
              x={size / 2}
              y={size / 2 - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xl font-bold fill-neutral-900"
              style={{ fontSize: 22 }}
            >
              {total.toLocaleString('fa-IR')}
            </text>
            <text
              x={size / 2}
              y={size / 2 + 16}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-neutral-400"
              style={{ fontSize: 11 }}
            >
              مجموع
            </text>
          </svg>

          {/* Animated reveal circle */}
          {animate && (
            <svg 
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="absolute inset-0 pointer-events-none"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={(size / 2 - 5) - donutWidth / 2}
                fill="none"
                stroke="white"
                strokeWidth={donutWidth + 4}
                className="pie-reveal-animation"
              />
            </svg>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pieReveal {
          from {
            stroke-dashoffset: ${Math.PI * 2 * ((size / 2 - 5) - donutWidth / 2)};
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .pie-reveal-animation {
          stroke-dasharray: ${Math.PI * 2 * ((size / 2 - 5) - donutWidth / 2)};
          stroke-dashoffset: 0;
          animation: pieReveal 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
