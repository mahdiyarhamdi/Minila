'use client'

import { cn } from '@/lib/utils'
import TrendIndicator from './TrendIndicator'

interface MetricRow {
  label: string
  today: number
  week: number
  month: number
  growth: number // Percentage
  icon?: React.ReactNode
}

interface MetricTableProps {
  title?: string
  rows: MetricRow[]
  className?: string
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString('fa-IR')
}

export default function MetricTable({
  title,
  rows,
  className,
}: MetricTableProps) {
  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden",
      className
    )}>
      {title && (
        <div className="px-6 py-4 border-b border-neutral-100">
          <h3 className="font-semibold text-neutral-800 text-lg">{title}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50">
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                متریک
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                امروز
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                هفته
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                ماه
              </th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                رشد
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row, index) => (
              <tr 
                key={index}
                className="hover:bg-neutral-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {row.icon && (
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600">
                        {row.icon}
                      </div>
                    )}
                    <span className="font-medium text-neutral-800">{row.label}</span>
                  </div>
                </td>
                <td className="text-center px-4 py-4">
                  <span className="font-semibold text-neutral-900">
                    {formatNumber(row.today)}
                  </span>
                </td>
                <td className="text-center px-4 py-4">
                  <span className="font-semibold text-neutral-900">
                    {formatNumber(row.week)}
                  </span>
                </td>
                <td className="text-center px-4 py-4">
                  <span className="font-semibold text-neutral-900">
                    {formatNumber(row.month)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <TrendIndicator value={row.growth} size="sm" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

