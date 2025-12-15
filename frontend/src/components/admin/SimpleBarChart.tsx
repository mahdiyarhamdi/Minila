'use client'

import { cn } from '@/lib/utils'

interface Dataset {
  label: string
  data: number[]
  color?: string
}

interface SimpleBarChartProps {
  labels: string[]
  datasets: Dataset[]
  height?: number
  title?: string
  stacked?: boolean
}

export default function SimpleBarChart({
  labels,
  datasets,
  height = 200,
  title,
  stacked = false,
}: SimpleBarChartProps) {
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

  const defaultColors = ['#00A8E8', '#E5C189', '#10B981', '#F59E0B', '#EF4444']

  // Calculate max value
  let maxValue: number
  if (stacked) {
    maxValue = Math.max(
      ...labels.map((_, i) => 
        datasets.reduce((sum, d) => sum + (d.data[i] || 0), 0)
      ),
      1
    )
  } else {
    maxValue = Math.max(...datasets.flatMap(d => d.data), 1)
  }

  const barWidth = stacked ? 60 : (70 / datasets.length)
  const barGap = stacked ? 0 : 2

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      {title && <h3 className="font-semibold text-neutral-900 mb-4">{title}</h3>}

      {/* Legend */}
      {datasets.length > 1 && (
        <div className="flex flex-wrap gap-4 mb-4">
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

      {/* Chart */}
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 ${labels.length * 14} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1="0"
              y1={20 + (percent / 100) * (height - 60)}
              x2={labels.length * 14}
              y2={20 + (percent / 100) * (height - 60)}
              stroke="#E5E5E5"
              strokeWidth="0.5"
            />
          ))}

          {/* Bars */}
          {labels.map((label, labelIndex) => {
            const x = labelIndex * 14 + 2

            if (stacked) {
              let currentY = height - 40
              return (
                <g key={labelIndex}>
                  {datasets.map((dataset, datasetIndex) => {
                    const value = dataset.data[labelIndex] || 0
                    const barHeight = (value / maxValue) * (height - 60)
                    const color = dataset.color || defaultColors[datasetIndex % defaultColors.length]
                    
                    const rect = (
                      <rect
                        key={datasetIndex}
                        x={x}
                        y={currentY - barHeight}
                        width={10}
                        height={barHeight}
                        fill={color}
                        rx="1"
                      />
                    )
                    currentY -= barHeight
                    return rect
                  })}
                </g>
              )
            } else {
              return (
                <g key={labelIndex}>
                  {datasets.map((dataset, datasetIndex) => {
                    const value = dataset.data[labelIndex] || 0
                    const barHeight = (value / maxValue) * (height - 60)
                    const color = dataset.color || defaultColors[datasetIndex % defaultColors.length]
                    const barX = x + datasetIndex * (10 / datasets.length + barGap)

                    return (
                      <rect
                        key={datasetIndex}
                        x={barX}
                        y={height - 40 - barHeight}
                        width={10 / datasets.length}
                        height={barHeight}
                        fill={color}
                        rx="1"
                      />
                    )
                  })}
                </g>
              )
            }
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-4 text-xs text-neutral-500">
          <span>{Math.round(maxValue).toLocaleString('fa-IR')}</span>
          <span>{Math.round(maxValue / 2).toLocaleString('fa-IR')}</span>
          <span>۰</span>
        </div>
      </div>

      {/* X-axis labels */}
      {labels.length <= 14 && (
        <div className="flex justify-between mt-2 text-xs text-neutral-500">
          {labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0).map((label, index) => (
            <span key={index}>{label.split('-').slice(1).join('/')}</span>
          ))}
        </div>
      )}
    </div>
  )
}



