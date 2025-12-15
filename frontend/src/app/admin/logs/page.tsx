'use client'

import { useEffect, useState } from 'react'
import { apiService, AdminLog, AdminLogsParams } from '@/lib/api'
import { cn } from '@/lib/utils'

const eventTypeLabels: Record<string, string> = {
  signup: 'ثبت‌نام',
  login: 'ورود',
  email_verified: 'تایید ایمیل',
  join_request: 'درخواست عضویت',
  join_approved: 'تایید عضویت',
  join_rejected: 'رد عضویت',
  card_create: 'ساخت کارت',
  card_delete: 'حذف کارت',
  message_send: 'ارسال پیام',
  ban: 'مسدود کردن',
  unban: 'رفع مسدودیت',
  grant_admin: 'اعطای ادمین',
  revoke_admin: 'لغو ادمین',
  community_delete: 'حذف کامیونیتی',
  report_resolve: 'بررسی گزارش',
}

const eventTypeColors: Record<string, string> = {
  signup: 'bg-green-100 text-green-700',
  login: 'bg-blue-100 text-blue-700',
  email_verified: 'bg-blue-100 text-blue-700',
  join_request: 'bg-yellow-100 text-yellow-700',
  join_approved: 'bg-green-100 text-green-700',
  join_rejected: 'bg-red-100 text-red-700',
  card_create: 'bg-primary-100 text-primary-700',
  card_delete: 'bg-red-100 text-red-700',
  message_send: 'bg-purple-100 text-purple-700',
  ban: 'bg-red-100 text-red-700',
  unban: 'bg-green-100 text-green-700',
  grant_admin: 'bg-purple-100 text-purple-700',
  revoke_admin: 'bg-yellow-100 text-yellow-700',
  community_delete: 'bg-red-100 text-red-700',
  report_resolve: 'bg-neutral-100 text-neutral-700',
}

const eventTypes = [
  'signup', 'login', 'email_verified', 'join_request', 'join_approved', 
  'join_rejected', 'card_create', 'card_delete', 'message_send', 
  'ban', 'unban', 'grant_admin', 'revoke_admin', 'community_delete', 'report_resolve'
]

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // فیلترها
  const [filterEventType, setFilterEventType] = useState<string>('')

  // Detail modal
  const [detailModal, setDetailModal] = useState<AdminLog | null>(null)

  const pageSize = 30

  useEffect(() => {
    loadLogs()
  }, [page, filterEventType])

  const loadLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: AdminLogsParams = {
        page,
        page_size: pageSize,
        event_type: filterEventType || undefined,
      }

      const data = await apiService.getAdminLogs(params)
      setLogs(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load logs:', err)
      setError('خطا در بارگذاری لاگ‌ها')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">لاگ‌ها و رویدادها</h1>
          <p className="text-neutral-600 mt-1">
            {total.toLocaleString('fa-IR')} رویداد
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          بروزرسانی
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setFilterEventType('')
              setPage(1)
            }}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors",
              !filterEventType
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            )}
          >
            همه
          </button>
          {eventTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilterEventType(type)
                setPage(1)
              }}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors",
                filterEventType === type
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              )}
            >
              {eventTypeLabels[type] || type}
            </button>
          ))}
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
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500">لاگی یافت نشد</p>
        </div>
      ) : (
        <>
          {/* Logs List */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setDetailModal(log)}
                  className="px-4 py-3 hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Event Type Badge */}
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full flex-shrink-0",
                      eventTypeColors[log.event_type] || "bg-neutral-100 text-neutral-700"
                    )}>
                      {eventTypeLabels[log.event_type] || log.event_type}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {log.actor_email && (
                          <span className="text-neutral-900 font-medium" dir="ltr">
                            {log.actor_email}
                          </span>
                        )}
                        {log.target_email && (
                          <>
                            <span className="text-neutral-400">→</span>
                            <span className="text-neutral-700" dir="ltr">
                              {log.target_email}
                            </span>
                          </>
                        )}
                        {log.community_name && (
                          <span className="text-neutral-500">
                            [{log.community_name}]
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(log.created_at).toLocaleString('fa-IR')}
                        {log.ip && (
                          <span className="mr-2" dir="ltr">
                            • IP: {log.ip}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Arrow */}
                    <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
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

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-neutral-900">جزئیات رویداد</h3>
              <button
                onClick={() => setDetailModal(null)}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500 mb-1">نوع رویداد</p>
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    eventTypeColors[detailModal.event_type] || "bg-neutral-100 text-neutral-700"
                  )}>
                    {eventTypeLabels[detailModal.event_type] || detailModal.event_type}
                  </span>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1">تاریخ</p>
                  <p className="text-neutral-900">{new Date(detailModal.created_at).toLocaleString('fa-IR')}</p>
                </div>
              </div>

              {detailModal.actor_email && (
                <div>
                  <p className="text-neutral-500 text-sm mb-1">انجام‌دهنده</p>
                  <p className="text-neutral-900" dir="ltr">{detailModal.actor_email}</p>
                </div>
              )}

              {detailModal.target_email && (
                <div>
                  <p className="text-neutral-500 text-sm mb-1">هدف</p>
                  <p className="text-neutral-900" dir="ltr">{detailModal.target_email}</p>
                </div>
              )}

              {detailModal.community_name && (
                <div>
                  <p className="text-neutral-500 text-sm mb-1">کامیونیتی</p>
                  <p className="text-neutral-900">{detailModal.community_name}</p>
                </div>
              )}

              {detailModal.ip && (
                <div>
                  <p className="text-neutral-500 text-sm mb-1">IP</p>
                  <p className="text-neutral-900 font-mono text-sm" dir="ltr">{detailModal.ip}</p>
                </div>
              )}

              {detailModal.user_agent && (
                <div>
                  <p className="text-neutral-500 text-sm mb-1">User Agent</p>
                  <p className="text-neutral-700 text-xs font-mono bg-neutral-50 p-2 rounded-lg break-all" dir="ltr">
                    {detailModal.user_agent}
                  </p>
                </div>
              )}

              {detailModal.payload && (
                <div>
                  <p className="text-neutral-500 text-sm mb-1">اطلاعات اضافی</p>
                  <pre className="text-neutral-700 text-xs font-mono bg-neutral-50 p-2 rounded-lg overflow-x-auto" dir="ltr">
                    {detailModal.payload}
                  </pre>
                </div>
              )}
            </div>

            <button
              onClick={() => setDetailModal(null)}
              className="w-full mt-6 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  )
}



