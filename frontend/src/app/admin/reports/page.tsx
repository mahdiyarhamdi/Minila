'use client'

import { useEffect, useState } from 'react'
import { apiService, AdminReport } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Resolve modal
  const [resolveModal, setResolveModal] = useState<AdminReport | null>(null)
  const [resolveAction, setResolveAction] = useState<'resolved' | 'dismissed' | 'ban_user'>('resolved')
  const [resolveNote, setResolveNote] = useState('')
  const [resolveLoading, setResolveLoading] = useState(false)

  const pageSize = 20

  useEffect(() => {
    loadReports()
  }, [page])

  const loadReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await apiService.getAdminReports({
        page,
        page_size: pageSize,
      })
      setReports(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load reports:', err)
      setError('خطا در بارگذاری گزارش‌ها')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!resolveModal) return
    
    try {
      setResolveLoading(true)
      await apiService.resolveReport(resolveModal.id, resolveAction, resolveNote || undefined)
      
      // حذف از لیست
      setReports(reports.filter(r => r.id !== resolveModal.id))
      setTotal(total - 1)
      setResolveModal(null)
      setResolveAction('resolved')
      setResolveNote('')
    } catch (err) {
      console.error('Failed to resolve report:', err)
      alert('خطا در بررسی گزارش')
    } finally {
      setResolveLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">گزارش‌ها و شکایات</h1>
          <p className="text-neutral-600 mt-1">
            {total.toLocaleString('fa-IR')} گزارش
          </p>
        </div>
        <button
          onClick={loadReports}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          بروزرسانی
        </button>
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
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
          <svg className="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-neutral-500">گزارشی برای بررسی وجود ندارد</p>
        </div>
      ) : (
        <>
          {/* Reports List */}
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Report Info */}
                  <div className="flex-1 space-y-3">
                    {/* Reporter & Reported */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-neutral-500">گزارش‌دهنده: </span>
                        <span className="font-medium text-neutral-900">
                          {report.reporter_name || report.reporter_email || 'نامشخص'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">گزارش‌شده: </span>
                        <span className="font-medium text-neutral-900">
                          {report.reported_name || report.reported_email || 'نامشخص'}
                        </span>
                      </div>
                      {report.card_id && (
                        <div>
                          <span className="text-neutral-500">کارت: </span>
                          <a
                            href={`/cards/${report.card_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline"
                          >
                            #{report.card_id}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Report Body */}
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <p className="text-neutral-700 whitespace-pre-wrap">{report.body}</p>
                    </div>

                    {/* Date */}
                    <p className="text-xs text-neutral-500">
                      {new Date(report.created_at).toLocaleString('fa-IR')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row lg:flex-col gap-2">
                    <button
                      onClick={() => setResolveModal(report)}
                      className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      بررسی
                    </button>
                    {report.reported_id && (
                      <button
                        onClick={() => {
                          setResolveModal(report)
                          setResolveAction('ban_user')
                        }}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        بن کاربر
                      </button>
                    )}
                  </div>
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

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">
              بررسی گزارش
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  اقدام
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="action"
                      value="resolved"
                      checked={resolveAction === 'resolved'}
                      onChange={() => setResolveAction('resolved')}
                      className="text-primary-600"
                    />
                    <span className="text-sm">حل شده</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="action"
                      value="dismissed"
                      checked={resolveAction === 'dismissed'}
                      onChange={() => setResolveAction('dismissed')}
                      className="text-primary-600"
                    />
                    <span className="text-sm">رد شده (بی‌اساس)</span>
                  </label>
                  {resolveModal.reported_id && (
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="action"
                        value="ban_user"
                        checked={resolveAction === 'ban_user'}
                        onChange={() => setResolveAction('ban_user')}
                        className="text-red-600"
                      />
                      <span className="text-sm text-red-600">مسدود کردن کاربر گزارش‌شده</span>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  یادداشت (اختیاری)
                </label>
                <textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="توضیحات..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setResolveModal(null)
                  setResolveAction('resolved')
                  setResolveNote('')
                }}
                className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                disabled={resolveLoading}
              >
                انصراف
              </button>
              <button
                onClick={handleResolve}
                disabled={resolveLoading}
                className={cn(
                  "px-4 py-2 text-white rounded-lg transition-colors",
                  resolveAction === 'ban_user'
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary-600 hover:bg-primary-700",
                  resolveLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {resolveLoading ? 'در حال انجام...' : 'تایید'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

