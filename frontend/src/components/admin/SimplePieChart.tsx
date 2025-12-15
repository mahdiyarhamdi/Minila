'use client'

import { cn } from '@/lib/utils'

interface PieDataItem {
  label: string
  value: number
  color?: string
}

interface SimplePieChartProps {
  data: PieDataItem[]
  size?: number
  title?: string
  showLegend?: boolean
}

export default function SimplePieChart({
  data,
  size = 200,
  title,
  showLegend = true,
}: SimplePieChartProps) {
  const defaultColors = ['#00A8E8', '#E5C189', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  if (total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        {title && <h3 className="font-semibold text-neutral-900 mb-4">{title}</h3>}
        <div className="h-48 flex items-center justify-center text-neutral-500">
          داده‌ای برای نمایش وجود ندارد
        </div>
      </div>
    )
  }

  // Calculate pie slices
  let currentAngle = -90 // Start from top
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100
    const angle = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    // Calculate path
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 10

    const x1 = cx + radius * Math.cos(startRad)
    const y1 = cy + radius * Math.sin(startRad)
    const x2 = cx + radius * Math.cos(endRad)
    const y2 = cy + radius * Math.sin(endRad)

    const largeArcFlag = angle > 180 ? 1 : 0

    const pathData = [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ')

    return {
      ...item,
      pathData,
      percentage,
      color: item.color || defaultColors[index % defaultColors.length],
    }
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      {title && <h3 className="font-semibold text-neutral-900 mb-4">{title}</h3>}

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Pie Chart */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
            {slices.map((slice, index) => (
              <path
                key={index}
                d={slice.pathData}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
                className="transition-opacity hover:opacity-80"
              />
            ))}
            {/* Center circle for donut effect */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 4}
              fill="white"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-neutral-900">
              {total.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-neutral-500">مجموع</span>
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-col gap-2">
            {slices.map((slice, index) => (
              <div key={index} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-sm text-neutral-700 flex-1">{slice.label}</span>
                <span className="text-sm font-medium text-neutral-900">
                  {slice.value.toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-neutral-500 w-12 text-left">
                  ({slice.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



