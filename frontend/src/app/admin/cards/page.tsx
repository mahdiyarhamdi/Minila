'use client'

import { useEffect, useState } from 'react'
import { apiService, AdminCard, AdminCardsParams } from '@/lib/api'
import { DataTable } from '@/components/admin'
import { cn } from '@/lib/utils'

export default function AdminCardsPage() {
  const [cards, setCards] = useState<AdminCard[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // فیلترها
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'traveler' | 'sender'>('all')

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<AdminCard | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const pageSize = 20

  useEffect(() => {
    loadCards()
  }, [page, filterType])

  const loadCards = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: AdminCardsParams = {
        page,
        page_size: pageSize,
        search: search || undefined,
      }

      if (filterType === 'traveler') params.is_sender = false
      if (filterType === 'sender') params.is_sender = true

      const data = await apiService.getAdminCards(params)
      setCards(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load cards:', err)
      setError('خطا در بارگذاری کارت‌ها')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadCards()
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    
    try {
      setDeleteLoading(true)
      await apiService.deleteAdminCard(deleteModal.id)
      
      setCards(cards.filter(c => c.id !== deleteModal.id))
      setTotal(total - 1)
      setDeleteModal(null)
    } catch (err) {
      console.error('Failed to delete card:', err)
      alert('خطا در حذف کارت')
    } finally {
      setDeleteLoading(false)
    }
  }

  const columns = [
    {
      key: 'type',
      title: 'نوع',
      render: (card: AdminCard) => (
        <span className={cn(
          "px-2 py-1 text-xs font-medium rounded-full",
          card.is_sender
            ? "bg-sand-100 text-sand-700"
            : "bg-primary-100 text-primary-700"
        )}>
          {card.is_sender ? 'فرستنده' : 'مسافر'}
        </span>
      ),
    },
    {
      key: 'route',
      title: 'مسیر',
      render: (card: AdminCard) => (
        <div className="text-sm">
          <p className="text-neutral-900">
            {card.origin_city}, {card.origin_country}
          </p>
          <p className="text-neutral-500">
            ← {card.destination_city}, {card.destination_country}
          </p>
        </div>
      ),
    },
    {
      key: 'owner',
      title: 'مالک',
      render: (card: AdminCard) => (
        <div>
          <p className="text-sm text-neutral-900">{card.owner_name || '-'}</p>
          <p className="text-xs text-neutral-500" dir="ltr">{card.owner_email}</p>
        </div>
      ),
    },
    {
      key: 'details',
      title: 'جزئیات',
      render: (card: AdminCard) => (
        <div className="text-sm text-neutral-600">
          {card.weight && <p>{card.weight} کیلوگرم</p>}
          {card.price_aed && <p>{card.price_aed} {card.currency || 'USD'}</p>}
        </div>
      ),
    },
    {
      key: 'created_at',
      title: 'تاریخ',
      sortable: true,
      render: (card: AdminCard) => (
        <span className="text-sm text-neutral-600">
          {new Date(card.created_at).toLocaleDateString('fa-IR')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'عملیات',
      render: (card: AdminCard) => (
        <div className="flex items-center gap-2">
          <a
            href={`/cards/${card.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg transition-colors"
          >
            مشاهده
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDeleteModal(card)
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
          <h1 className="text-2xl font-bold text-neutral-900">مدیریت کارت‌ها</h1>
          <p className="text-neutral-600 mt-1">
            {total.toLocaleString('fa-IR')} کارت
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
              placeholder="جستجو در توضیحات..."
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any)
                setPage(1)
              }}
              className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">همه</option>
              <option value="traveler">مسافر</option>
              <option value="sender">فرستنده</option>
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
        data={cards}
        loading={loading}
        emptyMessage="کارتی یافت نشد"
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
              حذف کارت
            </h3>
            <p className="text-neutral-600 mb-4">
              آیا مطمئن هستید که می‌خواهید این کارت را حذف کنید؟
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

