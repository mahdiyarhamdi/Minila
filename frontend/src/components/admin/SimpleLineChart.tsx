'use client'

import { cn } from '@/lib/utils'

interface Dataset {
  label: string
  data: number[]
  color?: string
}

interface SimpleLineChartProps {
  labels: string[]
  datasets: Dataset[]
  height?: number
  showLabels?: boolean
  title?: string
  xAxisLabel?: string
  yAxisLabel?: string
}

export default function SimpleLineChart({
  labels,
  datasets,
  height = 200,
  showLabels = true,
  title,
  xAxisLabel = 'تاریخ',
  yAxisLabel = 'تعداد',
}: SimpleLineChartProps) {
  if (!datasets.length || !datasets[0].data.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        {title && <h3 className="font-semibold text-neutral-900 mb-4">{title}</h3>}
        <div className="h-48 flex items-center justify-center text-neutral-500">
          داده‌ای برای نمایش وجود ندارد
        </div>
      </div>
    )
  }

  // Calculate max value for scaling
  const allValues = datasets.flatMap(d => d.data)
  const maxValue = Math.max(...allValues, 1)
  const minValue = Math.min(...allValues, 0)
  const range = maxValue - minValue || 1

  // Generate points for SVG
  const getPoints = (data: number[]) => {
    const padding = 40
    const width = 100 // percentage
    const usableWidth = width - 10
    const usableHeight = height - padding * 2

    return data.map((value, index) => {
      const x = (index / (data.length - 1)) * usableWidth + 5
      const y = padding + ((maxValue - value) / range) * usableHeight
      return { x, y }
    })
  }

  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return ''
    
    // Simple line path
    return points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ')
  }

  const defaultColors = ['#00A8E8', '#E5C189', '#10B981', '#F59E0B', '#EF4444']

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      {title && <h3 className="font-semibold text-neutral-900 mb-4">{title}</h3>}
      
      {/* Legend */}
      {datasets.length > 1 && (
        <div className="flex flex-wrap gap-4 mb-4">
          {datasets.map((dataset, index) => (
            <div key={dataset.label} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dataset.color || defaultColors[index % defaultColors.length] }}
              />
              <span className="text-sm text-neutral-600">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="relative" style={{ height }}>
        {/* Y-axis title */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-neutral-600 whitespace-nowrap">
          {yAxisLabel}
        </div>
        
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full mr-4"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1="5"
              y1={40 + (percent / 100) * (height - 80)}
              x2="95"
              y2={40 + (percent / 100) * (height - 80)}
              stroke="#E5E5E5"
              strokeWidth="0.5"
            />
          ))}

          {/* Lines */}
          {datasets.map((dataset, index) => {
            const points = getPoints(dataset.data)
            const path = createPath(points)
            const color = dataset.color || defaultColors[index % defaultColors.length]

            return (
              <g key={dataset.label}>
                {/* Area fill */}
                <path
                  d={`${path} L ${points[points.length - 1].x} ${height - 40} L ${points[0].x} ${height - 40} Z`}
                  fill={color}
                  fillOpacity="0.1"
                />
                {/* Line */}
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Points */}
                {points.map((point, pointIndex) => (
                  <circle
                    key={pointIndex}
                    cx={point.x}
                    cy={point.y}
                    r="1.5"
                    fill={color}
                    className="hover:r-3 transition-all"
                  />
                ))}
              </g>
            )
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-8 text-xs text-neutral-500">
          <span>{Math.round(maxValue).toLocaleString('fa-IR')}</span>
          <span>{Math.round((maxValue + minValue) / 2).toLocaleString('fa-IR')}</span>
          <span>{Math.round(minValue).toLocaleString('fa-IR')}</span>
        </div>
      </div>

      {/* X-axis labels */}
      {showLabels && labels.length > 0 && (
        <div className="flex justify-between mt-2 text-xs text-neutral-500 px-4">
          {labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0).map((label, index) => (
            <span key={index}>{label.split('-').slice(1).join('/')}</span>
          ))}
        </div>
      )}
      
      {/* X-axis title */}
      <div className="text-center mt-1 text-xs font-medium text-neutral-600">
        {xAxisLabel}
      </div>
    </div>
  )
}




