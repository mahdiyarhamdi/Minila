'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCard, useDeleteCard } from '@/hooks/useCards'
import { useAuth } from '@/contexts/AuthContext'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'

/**
 * صفحه جزئیات کارت
 */
export default function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const cardId = parseInt(resolvedParams.id)
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { data: card, isLoading, error } = useCard(cardId)
  const deleteCardMutation = useDeleteCard()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteCardMutation.mutateAsync(cardId)
      showToast('success', 'کارت با موفقیت حذف شد')
      router.push('/cards')
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'خطا در حذف کارت')
    }
  }

  const handleSendMessage = () => {
    if (card) {
      router.push(`/messages/${card.owner_id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card variant="bordered" className="p-6 max-w-md">
          <p className="text-red-600 text-center">کارت یافت نشد</p>
          <div className="mt-4 text-center">
            <Link href="/cards">
              <Button variant="ghost">بازگشت به لیست کارت‌ها</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const isOwner = user?.id === card.owner_id.toString()

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/cards" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          بازگشت به لیست کارت‌ها
        </Link>

        {/* Main Card */}
        <Card variant="elevated" className="p-8 mb-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">
                {card.origin} → {card.destination}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{card.category}</Badge>
                <Badge variant="neutral">{card.packaging_status}</Badge>
              </div>
            </div>

            {/* Actions */}
            {isOwner ? (
              <div className="flex gap-2">
                <Link href={`/cards/${card.id}/edit`}>
                  <Button variant="secondary" size="sm">
                    ویرایش
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(true)}>
                  حذف
                </Button>
              </div>
            ) : (
              <Button onClick={handleSendMessage}>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                ارسال پیام
              </Button>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {card.travel_date && (
              <div>
                <h3 className="text-sm font-medium text-neutral-600 mb-1">تاریخ سفر</h3>
                <p className="text-lg text-neutral-900">{new Date(card.travel_date).toLocaleDateString('fa-IR')}</p>
              </div>
            )}

            {card.capacity_kg && (
              <div>
                <h3 className="text-sm font-medium text-neutral-600 mb-1">ظرفیت</h3>
                <p className="text-lg text-neutral-900">{card.capacity_kg} کیلوگرم</p>
              </div>
            )}

            {card.price && (
              <div>
                <h3 className="text-sm font-medium text-neutral-600 mb-1">قیمت پیشنهادی</h3>
                <p className="text-lg font-bold text-primary-600">{card.price.toLocaleString('fa-IR')} تومان</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">تاریخ ایجاد</h3>
              <p className="text-lg text-neutral-900">{new Date(card.created_at).toLocaleDateString('fa-IR')}</p>
            </div>
          </div>

          {/* Description */}
          {card.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-600 mb-2">توضیحات</h3>
              <p className="text-neutral-900 font-light leading-relaxed">{card.description}</p>
            </div>
          )}

          {/* Owner Info */}
          <div className="pt-6 border-t border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-600 mb-3">صاحب کارت</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-bold text-lg">
                  {card.owner.first_name[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-neutral-900">
                  {card.owner.first_name} {card.owner.last_name}
                </p>
                <p className="text-sm text-neutral-600 font-light" dir="ltr">{card.owner.email}</p>
              </div>
            </div>
          </div>

          {/* Communities */}
          {card.communities && card.communities.length > 0 && (
            <div className="pt-6 border-t border-neutral-200">
              <h3 className="text-sm font-medium text-neutral-600 mb-3">کامیونیتی‌ها</h3>
              <div className="flex flex-wrap gap-2">
                {card.communities.map((community) => (
                  <Link key={community.id} href={`/communities/${community.id}`}>
                    <Badge variant="info" size="md" className="cursor-pointer hover:bg-blue-200">
                      {community.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="حذف کارت"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-700">آیا از حذف این کارت اطمینان دارید؟ این عمل قابل بازگشت نیست.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              انصراف
            </Button>
            <Button variant="primary" onClick={handleDelete} isLoading={deleteCardMutation.isPending}>
              حذف کارت
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

