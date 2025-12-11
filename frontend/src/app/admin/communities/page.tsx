'use client'

import { useEffect, useState } from 'react'
import { apiService, AdminCommunity, AdminCommunitiesParams } from '@/lib/api'
import { DataTable } from '@/components/admin'
import { cn } from '@/lib/utils'

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<AdminCommunity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // فیلتر
  const [search, setSearch] = useState('')

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<AdminCommunity | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const pageSize = 20

  useEffect(() => {
    loadCommunities()
  }, [page])

  const loadCommunities = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: AdminCommunitiesParams = {
        page,
        page_size: pageSize,
        search: search || undefined,
      }

      const data = await apiService.getAdminCommunities(params)
      setCommunities(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load communities:', err)
      setError('خطا در بارگذاری کامیونیتی‌ها')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadCommunities()
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    
    try {
      setDeleteLoading(true)
      await apiService.deleteAdminCommunity(deleteModal.id)
      
      // حذف از لیست
      setCommunities(communities.filter(c => c.id !== deleteModal.id))
      setTotal(total - 1)
      setDeleteModal(null)
    } catch (err) {
      console.error('Failed to delete community:', err)
      alert('خطا در حذف کامیونیتی')
    } finally {
      setDeleteLoading(false)
    }
  }

  const columns = [
    {
      key: 'name',
      title: 'نام',
      render: (community: AdminCommunity) => (
        <div>
          <p className="font-medium text-neutral-900">{community.name}</p>
          <p className="text-xs text-neutral-500" dir="ltr">@{community.slug}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      title: 'مالک',
      render: (community: AdminCommunity) => (
        <div>
          <p className="text-sm text-neutral-900">{community.owner_name || '-'}</p>
          <p className="text-xs text-neutral-500" dir="ltr">{community.owner_email}</p>
        </div>
      ),
    },
    {
      key: 'stats',
      title: 'آمار',
      render: (community: AdminCommunity) => (
        <div className="text-sm">
          <p className="text-neutral-900">{community.members_count.toLocaleString('fa-IR')} عضو</p>
          {community.pending_requests_count > 0 && (
            <p className="text-yellow-600">{community.pending_requests_count.toLocaleString('fa-IR')} درخواست</p>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      title: 'تاریخ ساخت',
      sortable: true,
      render: (community: AdminCommunity) => (
        <span className="text-sm text-neutral-600">
          {new Date(community.created_at).toLocaleDateString('fa-IR')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (community: AdminCommunity) => (
        <div className="flex items-center gap-2">
          <a
            href={`/communities/${community.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg transition-colors"
          >
            مشاهده
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDeleteModal(community)
            }}
            className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
          >
            حذف
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
          <h1 className="text-2xl font-bold text-neutral-900">مدیریت کامیونیتی‌ها</h1>
          <p className="text-neutral-600 mt-1">
            {total.toLocaleString('fa-IR')} کامیونیتی
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
              placeholder="جستجو در نام یا slug..."
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            جستجو
          </button>
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
        data={communities}
        loading={loading}
        emptyMessage="کامیونیتی یافت نشد"
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
        }}
      />

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">
              حذف کامیونیتی
            </h3>
            <p className="text-neutral-600 mb-4">
              آیا مطمئن هستید که می‌خواهید کامیونیتی <strong>{deleteModal.name}</strong> را حذف کنید؟
              این عمل غیرقابل بازگشت است.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                disabled={deleteLoading}
              >
                انصراف
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className={cn(
                  "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors",
                  deleteLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {deleteLoading ? 'در حال حذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

