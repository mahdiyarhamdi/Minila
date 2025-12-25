'use client'

import { useEffect, useState } from 'react'
import { apiService, AdminAlert, AdminAlertStats } from '@/lib/api'
import { cn } from '@/lib/utils'

const alertTypeLabels: Record<string, string> = {
  error: 'خطای سیستمی',
  security: 'امنیتی',
  report: 'گزارش کاربر',
  user: 'کاربر جدید',
  card: 'کارت جدید',
  membership: 'درخواست عضویت',
}

const alertTypeColors: Record<string, string> = {
  error: 'bg-red-100 text-red-800',
  security: 'bg-orange-100 text-orange-800',
  report: 'bg-purple-100 text-purple-800',
  user: 'bg-blue-100 text-blue-800',
  card: 'bg-green-100 text-green-800',
  membership: 'bg-cyan-100 text-cyan-800',
}

const priorityLabels: Record<string, string> = {
  high: 'فوری',
  normal: 'عادی',
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([])
  const [stats, setStats] = useState<AdminAlertStats | null>(null)
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterType, setFilterType] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterRead, setFilterRead] = useState<string>('')

  const pageSize = 20

  useEffect(() => {
    loadAlerts()
    loadStats()
  }, [page, filterType, filterPriority, filterRead])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
      }
      
      if (filterType) params.type = filterType
      if (filterPriority) params.priority = filterPriority
      if (filterRead === 'unread') params.is_read = false
      if (filterRead === 'read') params.is_read = true

      const data = await apiService.getAdminAlerts(params as Parameters<typeof apiService.getAdminAlerts>[0])
      setAlerts(data.items)
      setTotal(data.total)
      setUnreadCount(data.unread_count)
    } catch (err) {
      console.error('Failed to load alerts:', err)
      setError('خطا در بارگذاری هشدارها')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await apiService.getAdminAlertStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load alert stats:', err)
    }
  }

  const handleMarkAsRead = async (alertId: number) => {
    try {
      await apiService.markAlertAsRead(alertId)
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark alert as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllAlertsAsRead()
      setAlerts(alerts.map(a => ({ ...a, is_read: true })))
      setUnreadCount(0)
      loadStats()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">هشدارها</h1>
          <p className="text-neutral-600 mt-1">
            {unreadCount > 0 ? (
              <span className="text-red-600 font-medium">{unreadCount.toLocaleString('fa-IR')} خوانده نشده</span>
            ) : (
              'همه خوانده شده'
            )}
            {' · '}
            {total.toLocaleString('fa-IR')} هشدار
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              علامت همه خوانده شده
            </button>
          )}
          <button
            onClick={() => { loadAlerts(); loadStats(); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            بروزرسانی
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">کل هشدارها</p>
            <p className="text-2xl font-bold text-neutral-900">{stats.total.toLocaleString('fa-IR')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">خوانده نشده</p>
            <p className="text-2xl font-bold text-red-600">{stats.unread.toLocaleString('fa-IR')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">فوری خوانده نشده</p>
            <p className="text-2xl font-bold text-orange-600">{stats.high_priority_unread.toLocaleString('fa-IR')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">گزارش کاربران</p>
            <p className="text-2xl font-bold text-purple-600">{(stats.by_type?.report || 0).toLocaleString('fa-IR')}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-neutral-700 mb-1">نوع</label>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">همه</option>
              {Object.entries(alertTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-neutral-700 mb-1">اولویت</label>
            <select
              value={filterPriority}
              onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">همه</option>
              <option value="high">فوری</option>
              <option value="normal">عادی</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-neutral-700 mb-1">وضعیت</label>
            <select
              value={filterRead}
              onChange={(e) => { setFilterRead(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">همه</option>
              <option value="unread">خوانده نشده</option>
              <option value="read">خوانده شده</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
          <svg className="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-neutral-500">هشداری یافت نشد</p>
        </div>
      ) : (
        <>
          {/* Alerts List */}
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "bg-white rounded-xl shadow-sm border p-4 transition-all",
                  alert.is_read 
                    ? "border-neutral-200 opacity-75" 
                    : "border-primary-200 bg-primary-50/30"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full",
                        alertTypeColors[alert.type] || 'bg-neutral-100 text-neutral-800'
                      )}>
                        {alertTypeLabels[alert.type] || alert.type}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full",
                        alert.priority === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-neutral-100 text-neutral-600'
                      )}>
                        {priorityLabels[alert.priority] || alert.priority}
                      </span>
                      {!alert.is_read && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          جدید
                        </span>
                      )}
                      {alert.email_sent && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          ایمیل شده
                        </span>
                      )}
                    </div>
                    
                    {/* Title & Message */}
                    <h3 className="font-medium text-neutral-900">{alert.title}</h3>
                    <p className="text-sm text-neutral-600 whitespace-pre-wrap">{alert.message}</p>
                    
                    {/* Extra Data */}
                    {alert.extra_data && Object.keys(alert.extra_data).length > 0 && (
                      <div className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-2 font-mono">
                        {Object.entries(alert.extra_data).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-neutral-400">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Date */}
                    <p className="text-xs text-neutral-500">
                      {new Date(alert.created_at).toLocaleString('fa-IR')}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  {!alert.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      علامت خوانده شده
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors",
                  page <= 1
                    ? "text-neutral-300 cursor-not-allowed"
                    : "text-neutral-700 hover:bg-neutral-100"
                )}
              >
                قبلی
              </button>
              <span className="px-4 py-2 text-neutral-600">
                صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors",
                  page >= totalPages
                    ? "text-neutral-300 cursor-not-allowed"
                    : "text-neutral-700 hover:bg-neutral-100"
                )}
              >
                بعدی
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

