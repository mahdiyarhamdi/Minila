'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: keyof T | string
  title: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  onRowClick?: (item: T) => void
  rowKey?: keyof T
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  emptyMessage = 'داده‌ای یافت نشد',
  pagination,
  onRowClick,
  rowKey = 'id' as keyof T,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const getValue = (item: T, key: string) => {
    const keys = key.split('.')
    let value: any = item
    for (const k of keys) {
      value = value?.[k]
    }
    return value
  }

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = getValue(a, sortKey)
        const bVal = getValue(b, sortKey)
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    : data

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "px-4 py-3 text-right text-sm font-semibold text-neutral-700",
                    column.sortable && "cursor-pointer hover:bg-neutral-100",
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.title}</span>
                    {column.sortable && sortKey === column.key && (
                      <svg
                        className={cn(
                          "w-4 h-4 transition-transform",
                          sortOrder === 'desc' && "rotate-180"
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"></div>
                    <span className="text-neutral-600">در حال بارگذاری...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-neutral-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={String(item[rowKey]) || index}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "border-b border-neutral-100 last:border-0",
                    onRowClick && "cursor-pointer hover:bg-neutral-50"
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn("px-4 py-3 text-sm", column.className)}
                    >
                      {column.render
                        ? column.render(item)
                        : getValue(item, String(column.key))}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
          <div className="text-sm text-neutral-600">
            نمایش {((pagination.page - 1) * pagination.pageSize) + 1} تا{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} از{' '}
            {pagination.total.toLocaleString('fa-IR')}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className={cn(
                "p-2 rounded-lg transition-colors",
                pagination.page <= 1
                  ? "text-neutral-300 cursor-not-allowed"
                  : "text-neutral-600 hover:bg-neutral-200"
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.page <= 3) {
                pageNum = i + 1
              } else if (pagination.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = pagination.page - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                    pageNum === pagination.page
                      ? "bg-primary-600 text-white"
                      : "text-neutral-600 hover:bg-neutral-200"
                  )}
                >
                  {pageNum.toLocaleString('fa-IR')}
                </button>
              )
            })}
            
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className={cn(
                "p-2 rounded-lg transition-colors",
                pagination.page >= totalPages
                  ? "text-neutral-300 cursor-not-allowed"
                  : "text-neutral-600 hover:bg-neutral-200"
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

