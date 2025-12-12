'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCard, useDeleteCard } from '@/hooks/useCards'
import { useSharedCommunities } from '@/hooks/useCommunities'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'
import { getCurrencyByCode, getCurrencyName, type SupportedLanguage } from '@/utils/currency'

/**
 * Card detail page
 */
export default function CardDetailPage({ params }: { params: { id: string } }) {
  const cardId = parseInt(params.id)
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { t, formatDate, language } = useTranslation()
  const { data: card, isLoading, error } = useCard(cardId)
  const deleteCardMutation = useDeleteCard()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [checkingShared, setCheckingShared] = useState(false)

  // Hook for checking shared community - only when user is logged in and card is loaded
  const ownerId = card?.owner?.id
  const shouldCheckShared = !!user && !!ownerId && user.id !== ownerId
  const { data: sharedData, isLoading: sharedLoading } = useSharedCommunities(
    ownerId || 0,
    shouldCheckShared
  )

  const handleDelete = async () => {
    try {
      await deleteCardMutation.mutateAsync(cardId)
      showToast('success', t('cards.detail.deleteSuccess'))
      router.push('/cards')
    } catch (error: any) {
      showToast('error', extractErrorMessage(error))
    }
  }

  const handleSendMessage = () => {
    if (!card || !user) {
      // If not logged in, redirect to login
      router.push('/auth/login')
      return
    }

    // If owner is the user themselves
    if (user.id === card.owner.id) {
      showToast('warning', t('cards.detail.cannotMessageSelf'))
      return
    }

    setCheckingShared(true)
    
    // Wait if data is still loading
    if (sharedLoading) {
      return
    }

    // Check for shared community
    if (sharedData?.has_shared_community) {
      // They have a shared community - redirect to messages
      router.push(`/messages/${card.owner.id}`)
    } else {
      // No shared community - redirect to join page
      router.push(`/cards/${cardId}/join-community`)
    }
  }

  // When shared data is loaded and we're in checking state
  useEffect(() => {
    if (checkingShared && !sharedLoading && sharedData && card) {
      if (sharedData.has_shared_community) {
        router.push(`/messages/${card.owner.id}`)
      } else {
        router.push(`/cards/${cardId}/join-community`)
      }
      setCheckingShared(false)
    }
  }, [checkingShared, sharedLoading, sharedData, card, cardId, router])

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
          <p className="text-red-600 text-center">{t('cards.detail.notFound')}</p>
          <div className="mt-4 text-center">
            <Link href="/cards">
              <Button variant="ghost">{t('cards.detail.backToList')}</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const isOwner = user?.id === card.owner.id

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <Link href="/cards" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 sm:mb-6">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm sm:text-base">{t('cards.detail.backToList')}</span>
        </Link>

        {/* Main Card */}
        <Card variant="elevated" className="p-4 sm:p-8 mb-6">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-xl sm:text-3xl font-extrabold text-neutral-900 mb-2">
                {card.origin_city.name} → {card.destination_city.name}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant={card.is_sender ? "warning" : "info"}>
                  {card.is_sender ? t('cards.detail.type.sender') : t('cards.detail.type.traveler')}
                </Badge>
                {card.product_classification && (
                  <Badge variant="neutral">{card.product_classification.name}</Badge>
                )}
                {card.is_packed === true && (
                  <Badge variant="success">{t('cards.detail.packed')}</Badge>
                )}
                {card.is_packed === false && (
                  <Badge variant="warning">{t('cards.detail.unpacked')}</Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            {isOwner ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <Link href={`/cards/${card.id}/edit`} className="flex-1 sm:flex-none">
                  <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                    {t('common.edit')}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(true)} className="flex-1 sm:flex-none">
                  {t('common.delete')}
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleSendMessage} 
                className="w-full sm:w-auto"
                isLoading={checkingShared || sharedLoading}
                disabled={checkingShared || sharedLoading}
              >
                <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {t('cards.detail.sendMessage')}
              </Button>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Full Origin and Destination */}
            <div>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">{t('cards.detail.origin')}</h3>
              <p className="text-lg text-neutral-900">
                {card.origin_city.name}, {card.origin_country.name}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">{t('cards.detail.destination')}</h3>
              <p className="text-lg text-neutral-900">
                {card.destination_city.name}, {card.destination_country.name}
              </p>
            </div>

            {/* Travel Date */}
            {card.ticket_date_time && (
              <div>
                <h3 className="text-sm font-medium text-neutral-600 mb-1">{t('cards.detail.travelDate')}</h3>
                <p className="text-lg text-neutral-900">
                  {formatDate(card.ticket_date_time)}
                </p>
              </div>
            )}

            {/* Time Frame for sender */}
            {card.start_time_frame && card.end_time_frame && (
              <div>
                <h3 className="text-sm font-medium text-neutral-600 mb-1">{t('cards.detail.timeFrame')}</h3>
                <p className="text-lg text-neutral-900">
                  {formatDate(card.start_time_frame)} - {formatDate(card.end_time_frame)}
                </p>
              </div>
            )}

            {/* Weight */}
            {card.weight && (
              <div>
                <h3 className="text-sm font-medium text-neutral-600 mb-1">{t('cards.detail.weight')}</h3>
                <p className="text-lg text-neutral-900">{card.weight} {t('cards.detail.kg')}</p>
              </div>
            )}

            {/* Price */}
            {card.price_aed && (
              <div>
                <h3 className="text-sm font-medium text-neutral-600 mb-1">{t('cards.detail.suggestedPrice')}</h3>
                <p className="text-lg font-bold text-primary-600">
                  {card.price_aed.toLocaleString()} {getCurrencyByCode(card.currency || 'USD') ? getCurrencyName(getCurrencyByCode(card.currency || 'USD')!, language as SupportedLanguage) : (card.currency || 'USD')}
                </p>
              </div>
            )}

            {/* Created Date */}
            <div>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">{t('cards.detail.createdAt')}</h3>
              <p className="text-lg text-neutral-900">
                {formatDate(card.created_at)}
              </p>
            </div>
          </div>

          {/* Description */}
          {card.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-600 mb-2">{t('cards.detail.description')}</h3>
              <p className="text-neutral-900 font-light leading-relaxed">{card.description}</p>
            </div>
          )}

          {/* Owner Info */}
          <div className="pt-6 border-t border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-600 mb-3">{t('cards.detail.owner')}</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-bold text-lg">
                  {card.owner.first_name?.[0] || '?'}
                </span>
              </div>
              <div>
                <p className="font-medium text-neutral-900">
                  {card.owner.first_name && card.owner.last_name
                    ? `${card.owner.first_name} ${card.owner.last_name}`
                    : t('cards.detail.unknownUser')}
                </p>
                <p className="text-sm text-neutral-600 font-light">{t('cards.detail.userId')}: {card.owner.id}</p>
              </div>
            </div>
          </div>

          {/* Communities */}
          {card.communities && card.communities.length > 0 && (
            <div className="pt-6 border-t border-neutral-200">
              <h3 className="text-sm font-medium text-neutral-600 mb-3">{t('cards.detail.communities')}</h3>
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
        title={t('cards.detail.confirmDelete')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm sm:text-base text-neutral-700">{t('cards.detail.confirmDeleteMessage')}</p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="w-full sm:w-auto">
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleDelete} isLoading={deleteCardMutation.isPending} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
              {t('cards.detail.deleteCard')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
