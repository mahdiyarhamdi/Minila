'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { apiService, AdminBackupInfo, AdminBackupList } from '@/lib/api'
import { cn } from '@/lib/utils'

// Progress steps for restore
const RESTORE_STEPS = [
  { id: 1, label: 'شروع فرآیند بازگردانی', description: 'در حال آماده‌سازی...' },
  { id: 2, label: 'ایجاد بکاپ امنیتی', description: 'ذخیره وضعیت فعلی دیتابیس' },
  { id: 3, label: 'خواندن فایل بکاپ', description: 'در حال خواندن محتوای فایل' },
  { id: 4, label: 'بازگردانی جداول', description: 'در حال بازگردانی داده‌ها' },
  { id: 5, label: 'اتمام بازگردانی', description: 'بررسی نهایی' },
]

export default function AdminBackupsPage() {
  const [backups, setBackups] = useState<AdminBackupInfo[]>([])
  const [totalSize, setTotalSize] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Actions state
  const [creating, setCreating] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  
  // Upload state
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Restore state with progress
  const [restoring, setRestoring] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null)
  const [restoreProgress, setRestoreProgress] = useState(0)
  const [restoreStep, setRestoreStep] = useState(0)
  const [restoreMessage, setRestoreMessage] = useState('')
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [restoreResult, setRestoreResult] = useState<{ success: boolean; message: string } | null>(null)

  const loadBackups = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await apiService.getAdminBackups()
      setBackups(data.backups)
      setTotalSize(data.total_size_mb)
    } catch (err) {
      console.error('Failed to load backups:', err)
      setError('خطا در بارگذاری لیست بکاپ‌ها')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBackups()
    
    // Auto refresh every 30 seconds
    const interval = setInterval(loadBackups, 30000)
    return () => clearInterval(interval)
  }, [loadBackups])

  const handleCreateBackup = async () => {
    try {
      setCreating(true)
      const result = await apiService.createAdminBackup()
      
      if (result.success) {
        await loadBackups()
        alert(result.message)
      } else {
        alert(result.message)
      }
    } catch (err: any) {
      console.error('Failed to create backup:', err)
      alert(err.message || 'خطا در ایجاد بکاپ')
    } finally {
      setCreating(false)
    }
  }

  const handleDownload = async (filename: string) => {
    try {
      setDownloading(filename)
      await apiService.downloadAdminBackup(filename)
    } catch (err: any) {
      console.error('Failed to download backup:', err)
      alert(err.message || 'خطا در دانلود بکاپ')
    } finally {
      setDownloading(null)
    }
  }

  const handleDelete = async (filename: string) => {
    try {
      setDeleting(filename)
      await apiService.deleteAdminBackup(filename)
      setConfirmDelete(null)
      await loadBackups()
    } catch (err: any) {
      console.error('Failed to delete backup:', err)
      alert(err.message || 'خطا در حذف بکاپ')
    } finally {
      setDeleting(null)
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file extension
    if (!file.name.endsWith('.sql.gz') && !file.name.endsWith('.gz') && !file.name.endsWith('.sql')) {
      alert('فرمت فایل باید .sql.gz، .gz یا .sql باشد')
      return
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      alert('حجم فایل نباید بیشتر از 500 مگابایت باشد')
      return
    }

    try {
      setUploading(true)
      const result = await apiService.uploadAdminBackup(file)
      
      if (result.success) {
        await loadBackups()
        alert(`${result.message}\nنام فایل: ${result.filename}\nحجم: ${result.size_mb} MB`)
      } else {
        alert(result.message)
      }
    } catch (err: any) {
      console.error('Failed to upload backup:', err)
      alert(err.message || 'خطا در آپلود بکاپ')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const simulateProgress = async () => {
    // Step 1: Starting
    setRestoreStep(1)
    setRestoreProgress(10)
    setRestoreMessage('در حال شروع فرآیند بازگردانی...')
    await new Promise(r => setTimeout(r, 500))

    // Step 2: Creating safety backup
    setRestoreStep(2)
    setRestoreProgress(25)
    setRestoreMessage('در حال ایجاد بکاپ امنیتی از وضعیت فعلی...')
    await new Promise(r => setTimeout(r, 1000))

    // Step 3: Reading backup file
    setRestoreStep(3)
    setRestoreProgress(40)
    setRestoreMessage('در حال خواندن و استخراج فایل بکاپ...')
    await new Promise(r => setTimeout(r, 800))

    // Step 4: Restoring tables
    setRestoreStep(4)
    setRestoreProgress(60)
    setRestoreMessage('در حال بازگردانی جداول دیتابیس...')
    
    // Simulate table restoration progress
    for (let i = 60; i <= 90; i += 5) {
      await new Promise(r => setTimeout(r, 300))
      setRestoreProgress(i)
      setRestoreMessage(`در حال بازگردانی جداول... (${Math.round((i-60)/30 * 100)}%)`)
    }
  }

  const handleRestore = async (filename: string) => {
    try {
      setRestoring(filename)
      setShowRestoreModal(true)
      setRestoreResult(null)
      setRestoreProgress(0)
      setRestoreStep(0)
      setConfirmRestore(null)
      
      // Start progress simulation
      const progressPromise = simulateProgress()
      
      // Call the actual restore API
      const result = await apiService.restoreAdminBackup(filename)
      
      // Wait for progress simulation to complete (if not already)
      await progressPromise
      
      // Step 5: Complete
      setRestoreStep(5)
      setRestoreProgress(100)
      
      if (result.success) {
        setRestoreMessage('✅ بازگردانی با موفقیت انجام شد!')
        setRestoreResult({ success: true, message: result.message })
      } else {
        setRestoreMessage('❌ خطا در بازگردانی')
        setRestoreResult({ success: false, message: result.message })
      }
      
      // Reload backups after a short delay
      await new Promise(r => setTimeout(r, 1000))
      await loadBackups()
      
    } catch (err: any) {
      console.error('Failed to restore backup:', err)
      setRestoreProgress(100)
      setRestoreMessage('❌ خطا در بازگردانی')
      setRestoreResult({ success: false, message: err.message || 'خطای غیرمنتظره در بازگردانی' })
    } finally {
      setRestoring(null)
    }
  }

  const closeRestoreModal = () => {
    setShowRestoreModal(false)
    setRestoreResult(null)
    setRestoreProgress(0)
    setRestoreStep(0)
    setRestoreMessage('')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && backups.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error && backups.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadBackups}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Restore Progress Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                {restoreResult ? (
                  restoreResult.success ? (
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )
                ) : (
                  <svg className="w-8 h-8 text-orange-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-neutral-900">
                {restoreResult ? (restoreResult.success ? 'بازگردانی موفق' : 'خطا در بازگردانی') : 'در حال بازگردانی بکاپ'}
              </h3>
              <p className="text-neutral-600 mt-1 text-sm">{restoring}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">پیشرفت</span>
                <span className="font-bold text-primary-600">{restoreProgress}%</span>
              </div>
              <div className="h-4 bg-neutral-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    restoreResult?.success === false ? "bg-red-500" : "bg-gradient-to-r from-orange-500 to-primary-500"
                  )}
                  style={{ width: `${restoreProgress}%` }}
                />
              </div>
            </div>

            {/* Current Step Message */}
            <div className="bg-neutral-50 rounded-xl p-4">
              <p className="text-center text-neutral-700 font-medium">{restoreMessage}</p>
            </div>

            {/* Steps Progress */}
            <div className="space-y-3">
              {RESTORE_STEPS.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors",
                    restoreStep > step.id 
                      ? "bg-green-500 text-white" 
                      : restoreStep === step.id 
                        ? "bg-orange-500 text-white animate-pulse" 
                        : "bg-neutral-200 text-neutral-500"
                  )}>
                    {restoreStep > step.id ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium text-sm",
                      restoreStep >= step.id ? "text-neutral-900" : "text-neutral-400"
                    )}>
                      {step.label}
                    </p>
                    <p className={cn(
                      "text-xs",
                      restoreStep >= step.id ? "text-neutral-600" : "text-neutral-400"
                    )}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Result Message */}
            {restoreResult && (
              <div className={cn(
                "rounded-xl p-4 text-center",
                restoreResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}>
                <p className="font-medium">{restoreResult.message}</p>
              </div>
            )}

            {/* Close Button (only show when complete) */}
            {restoreResult && (
              <button
                onClick={closeRestoreModal}
                className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
              >
                بستن
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">پشتیبان‌گیری</h1>
          <p className="text-neutral-600 mt-1">مدیریت بکاپ‌های دیتابیس</p>
        </div>
        <div className="flex gap-2">
          {/* Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept=".sql,.gz,.sql.gz"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>در حال آپلود...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>آپلود بکاپ</span>
              </>
            )}
          </button>
          
          {/* Create Backup Button */}
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors",
              creating && "opacity-50 cursor-not-allowed"
            )}
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>در حال ایجاد...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>ایجاد بکاپ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500 mb-1">تعداد بکاپ‌ها</p>
          <p className="text-2xl font-bold text-neutral-900">{backups.length.toLocaleString('fa-IR')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500 mb-1">حجم کل</p>
          <p className="text-2xl font-bold text-neutral-900">{totalSize.toLocaleString('fa-IR')} MB</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500 mb-1">نگهداری</p>
          <p className="text-2xl font-bold text-neutral-900">۷ روز</p>
        </div>
      </div>

      {/* Backups Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-700">نام فایل</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-700">حجم</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-700">تاریخ ایجاد</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-700">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <p>هیچ بکاپی وجود ندارد</p>
                    <p className="text-sm mt-1">روی "ایجاد بکاپ" کلیک کنید یا یک فایل بکاپ آپلود کنید</p>
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.filename} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          backup.filename.includes('full') ? "bg-green-100" : "bg-blue-100"
                        )}>
                          <svg className={cn(
                            "w-5 h-5",
                            backup.filename.includes('full') ? "text-green-600" : "text-blue-600"
                          )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-mono text-sm text-neutral-700" dir="ltr">{backup.filename}</span>
                          {backup.filename.includes('full') && (
                            <span className="block text-xs text-green-600 font-medium">✅ بکاپ کامل</span>
                          )}
                          {backup.filename.includes('before_restore') && (
                            <span className="block text-xs text-orange-600 font-medium">🔒 بکاپ امنیتی</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {backup.size_mb.toLocaleString('fa-IR')} MB
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {formatDate(backup.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Restore Button */}
                        {confirmRestore === backup.filename ? (
                          <div className="flex items-center gap-1 bg-orange-50 rounded-lg p-1">
                            <span className="text-xs text-orange-600 px-2">مطمئنید؟</span>
                            <button
                              onClick={() => handleRestore(backup.filename)}
                              disabled={restoring === backup.filename}
                              className={cn(
                                "p-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors",
                                restoring === backup.filename && "opacity-50 cursor-not-allowed"
                              )}
                              title="تایید بازگردانی"
                            >
                              {restoring === backup.filename ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmRestore(null)}
                              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="انصراف"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRestore(backup.filename)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="بازگردانی"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}

                        {/* Download Button */}
                        <button
                          onClick={() => handleDownload(backup.filename)}
                          disabled={downloading === backup.filename}
                          className={cn(
                            "p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",
                            downloading === backup.filename && "opacity-50 cursor-not-allowed"
                          )}
                          title="دانلود"
                        >
                          {downloading === backup.filename ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Delete Button */}
                        {confirmDelete === backup.filename ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(backup.filename)}
                              disabled={deleting === backup.filename}
                              className={cn(
                                "p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors",
                                deleting === backup.filename && "opacity-50 cursor-not-allowed"
                              )}
                              title="تایید حذف"
                            >
                              {deleting === backup.filename ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="انصراف"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(backup.filename)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning for Restore */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-orange-700">
            <p className="font-medium mb-1">⚠️ هشدار بازگردانی</p>
            <p>بازگردانی بکاپ، داده‌های فعلی دیتابیس را جایگزین می‌کند. قبل از بازگردانی، یک بکاپ امنیتی به صورت خودکار ایجاد می‌شود.</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">اطلاعات بکاپ‌گیری</p>
            <ul className="list-disc list-inside space-y-1">
              <li>بکاپ‌گیری اتوماتیک هر روز ساعت ۳ صبح انجام می‌شود</li>
              <li>بکاپ‌های قدیمی‌تر از ۷ روز به صورت خودکار حذف می‌شوند</li>
              <li>می‌توانید در هر زمان به صورت دستی بکاپ بگیرید</li>
              <li>فرمت‌های مجاز برای آپلود: .sql.gz, .gz, .sql</li>
              <li>حداکثر حجم فایل آپلود: 500 مگابایت</li>
              <li className="text-green-600 font-medium">✅ بکاپ‌های "full" شامل تمام داده‌ها از جمله کشورها و شهرها هستند</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
