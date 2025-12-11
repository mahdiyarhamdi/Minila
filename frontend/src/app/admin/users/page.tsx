'use client'

import { useEffect, useState } from 'react'
import { apiService, AdminUser, AdminUsersParams } from '@/lib/api'
import { DataTable } from '@/components/admin'
import { cn } from '@/lib/utils'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // فیلترها
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned' | 'admin'>('all')

  // Modal state
  const [actionModal, setActionModal] = useState<{
    type: 'ban' | 'admin' | null
    user: AdminUser | null
  }>({ type: null, user: null })
  const [actionReason, setActionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const pageSize = 20

  useEffect(() => {
    loadUsers()
  }, [page, filterStatus])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: AdminUsersParams = {
        page,
        page_size: pageSize,
        search: search || undefined,
      }

      if (filterStatus === 'active') params.is_active = true
      if (filterStatus === 'banned') params.is_active = false
      if (filterStatus === 'admin') params.is_admin = true

      const data = await apiService.getAdminUsers(params)
      setUsers(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError('خطا در بارگذاری کاربران')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadUsers()
  }

  const handleBanUser = async () => {
    if (!actionModal.user) return
    
    try {
      setActionLoading(true)
      const newStatus = !actionModal.user.is_active
      await apiService.banUser(actionModal.user.id, newStatus, actionReason || undefined)
      
      // بروزرسانی لیست
      setUsers(users.map(u => 
        u.id === actionModal.user?.id 
          ? { ...u, is_active: newStatus }
          : u
      ))
      
      setActionModal({ type: null, user: null })
      setActionReason('')
    } catch (err) {
      console.error('Failed to update user status:', err)
      alert('خطا در تغییر وضعیت کاربر')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleAdmin = async () => {
    if (!actionModal.user) return
    
    try {
      setActionLoading(true)
      const newStatus = !actionModal.user.is_admin
      await apiService.toggleAdminStatus(actionModal.user.id, newStatus)
      
      // بروزرسانی لیست
      setUsers(users.map(u => 
        u.id === actionModal.user?.id 
          ? { ...u, is_admin: newStatus }
          : u
      ))
      
      setActionModal({ type: null, user: null })
    } catch (err) {
      console.error('Failed to toggle admin status:', err)
      alert('خطا در تغییر وضعیت ادمین')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    {
      key: 'email',
      title: 'ایمیل',
      render: (user: AdminUser) => (
        <div>
          <p className="font-medium text-neutral-900" dir="ltr">{user.email}</p>
          <p className="text-xs text-neutral-500">
            {user.first_name} {user.last_name}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'وضعیت',
      render: (user: AdminUser) => (
        <div className="flex flex-wrap gap-1">
          {user.is_admin && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
              ادمین
            </span>
          )}
          {user.is_active ? (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              فعال
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
              مسدود
            </span>
          )}
          {user.email_verified && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              تایید شده
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'stats',
      title: 'آمار',
      render: (user: AdminUser) => (
        <div className="text-sm text-neutral-600">
          <p>{user.cards_count.toLocaleString('fa-IR')} کارت</p>
          <p>{user.communities_count.toLocaleString('fa-IR')} کامیونیتی</p>
        </div>
      ),
    },
    {
      key: 'created_at',
      title: 'تاریخ عضویت',
      sortable: true,
      render: (user: AdminUser) => (
        <span className="text-sm text-neutral-600">
          {new Date(user.created_at).toLocaleDateString('fa-IR')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (user: AdminUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setActionModal({ type: 'ban', user })
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              user.is_active
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            )}
          >
            {user.is_active ? 'مسدود' : 'فعال'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setActionModal({ type: 'admin', user })
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              user.is_admin
                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            )}
          >
            {user.is_admin ? 'لغو ادمین' : 'ادمین'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">مدیریت کاربران</h1>
          <p className="text-neutral-600 mt-1">
            {total.toLocaleString('fa-IR')} کاربر
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در ایمیل یا نام..."
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any)
                setPage(1)
              }}
              className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">همه</option>
              <option value="active">فعال</option>
              <option value="banned">مسدود</option>
              <option value="admin">ادمین</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              جستجو
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="کاربری یافت نشد"
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
        }}
      />

      {/* Ban/Unban Modal */}
      {actionModal.type === 'ban' && actionModal.user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">
              {actionModal.user.is_active ? 'مسدود کردن کاربر' : 'فعال کردن کاربر'}
            </h3>
            <p className="text-neutral-600 mb-4">
              آیا مطمئن هستید که می‌خواهید کاربر <strong>{actionModal.user.email}</strong> را{' '}
              {actionModal.user.is_active ? 'مسدود' : 'فعال'} کنید؟
            </p>
            {actionModal.user.is_active && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  دلیل (اختیاری)
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="دلیل مسدود کردن..."
                />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setActionModal({ type: null, user: null })
                  setActionReason('')
                }}
                className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                disabled={actionLoading}
              >
                انصراف
              </button>
              <button
                onClick={handleBanUser}
                disabled={actionLoading}
                className={cn(
                  "px-4 py-2 text-white rounded-lg transition-colors",
                  actionModal.user.is_active
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700",
                  actionLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {actionLoading ? 'در حال انجام...' : (actionModal.user.is_active ? 'مسدود کن' : 'فعال کن')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Toggle Modal */}
      {actionModal.type === 'admin' && actionModal.user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">
              {actionModal.user.is_admin ? 'لغو دسترسی ادمین' : 'اعطای دسترسی ادمین'}
            </h3>
            <p className="text-neutral-600 mb-4">
              آیا مطمئن هستید که می‌خواهید دسترسی ادمین کاربر <strong>{actionModal.user.email}</strong> را{' '}
              {actionModal.user.is_admin ? 'لغو' : 'اعطا'} کنید؟
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setActionModal({ type: null, user: null })}
                className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                disabled={actionLoading}
              >
                انصراف
              </button>
              <button
                onClick={handleToggleAdmin}
                disabled={actionLoading}
                className={cn(
                  "px-4 py-2 text-white rounded-lg transition-colors",
                  actionModal.user.is_admin
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-purple-600 hover:bg-purple-700",
                  actionLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {actionLoading ? 'در حال انجام...' : 'تایید'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

