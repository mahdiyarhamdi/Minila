'use client'

import Link from 'next/link'
import { useMyCards, useDeleteCard } from '@/hooks/useCards'
import Card from '@/components/Card'
import CardItem from '@/components/cards/CardItem'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@/components/Button'
import Tabs from '@/components/Tabs'
import { useState } from 'react'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'

/**
 * صفحه کارت‌های من
 */
export default function MyCardsPage() {
  const { data, isLoading, error } = useMyCards()
  const deleteCardMutation = useDeleteCard()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [deleteCardId, setDeleteCardId] = useState<number | null>(null)

  const handleDelete = async () => {
    if (!deleteCardId) return

    try {
      await deleteCardMutation.mutateAsync(deleteCardId)
      showToast('success', 'کارت با موفقیت حذف شد')
      setDeleteCardId(null)
    } catch (error: any) {
      showToast('error', extractErrorMessage(error))
    }
  }

  // فیلتر کارت‌ها بر اساس تب فعال
  const filteredCards = data?.items.filter((card) => {
    if (activeTab === 'all') return true
    
    // تاریخ سفر (برای مسافران) یا انتهای بازه زمانی (برای فرستندگان)
    const travelDate = card.ticket_date_time || card.end_time_frame
    
    if (activeTab === 'active') {
      // کارت‌های فعال (تاریخ سفر هنوز نگذشته یا تاریخ ندارد)
      if (!travelDate) return true
      return new Date(travelDate) >= new Date()
    }
    if (activeTab === 'expired') {
      // کارت‌های منقضی شده
      if (!travelDate) return false
      return new Date(travelDate) < new Date()
    }
    return true
  })

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
              کارت‌های من
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 font-light">
              مدیریت و مشاهده کارت‌های خودتان
            </p>
          </div>

          <Link href="/cards/new" className="w-full sm:w-auto self-start">
            <Button size="lg" className="w-full sm:w-auto">
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              ایجاد کارت جدید
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs
            tabs={[
              { id: 'all', label: 'همه', count: data?.items.length },
              {
                id: 'active',
                label: 'فعال',
                count: data?.items.filter((c) => {
                  const travelDate = c.ticket_date_time || c.end_time_frame
                  return !travelDate || new Date(travelDate) >= new Date()
                }).length,
              },
              {
                id: 'expired',
                label: 'منقضی شده',
                count: data?.items.filter((c) => {
                  const travelDate = c.ticket_date_time || c.end_time_frame
                  return travelDate && new Date(travelDate) < new Date()
                }).length,
              },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Content */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <Card variant="bordered" className="p-6">
            <p className="text-red-600 text-center">خطا در دریافت کارت‌ها</p>
          </Card>
        )}

        {filteredCards && filteredCards.length === 0 && (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            }
            title={activeTab === 'expired' ? 'کارت منقضی شده‌ای ندارید' : 'کارتی یافت نشد'}
            description={
              activeTab === 'expired'
                ? 'هیچ‌کدام از کارت‌های شما هنوز منقضی نشده‌اند.'
                : 'شما هنوز کارتی ایجاد نکرده‌اید. اولین کارت خود را بسازید.'
            }
            action={
              activeTab !== 'expired' ? (
              <Link href="/cards/new">
                <Button>ایجاد اولین کارت</Button>
              </Link>
              ) : undefined
            }
          />
        )}

        {filteredCards && filteredCards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => (
              <div key={card.id} className="relative group">
                <CardItem {...card} />
                
                {/* Action Buttons Overlay */}
                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Link href={`/cards/${card.id}/edit`}>
                    <button className="p-2 bg-white rounded-lg shadow-medium hover:bg-neutral-50">
                      <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </Link>
                  <button
                    onClick={() => setDeleteCardId(card.id)}
                    className="p-2 bg-white rounded-lg shadow-medium hover:bg-red-50"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteCardId !== null}
        onClose={() => setDeleteCardId(null)}
        title="حذف کارت"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm sm:text-base text-neutral-700">
            آیا از حذف این کارت اطمینان دارید؟ این عمل قابل بازگشت نیست.
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteCardId(null)} className="w-full sm:w-auto">
              انصراف
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              isLoading={deleteCardMutation.isPending}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              حذف کارت
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

