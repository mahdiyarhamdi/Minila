'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCard } from '@/hooks/useCards'
import { useUserCommunities, useJoinCommunity, useSharedCommunities } from '@/hooks/useCommunities'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'
import { translateError } from '@/lib/errorTranslation'

/**
 * Join community page for sending messages
 * This page is shown when user doesn't share a community with card owner
 */
export default function JoinCommunityPage({ params }: { params: { id: string } }) {
  const cardId = parseInt(params.id)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const { t } = useTranslation()
  
  const { data: card, isLoading: cardLoading } = useCard(cardId)
  const ownerId = card?.owner?.id
  
  // Check for shared community
  const { data: sharedData, isLoading: sharedLoading } = useSharedCommunities(
    ownerId || 0,
    !!ownerId && !!user
  )
  
  // Get card owner's communities
  const { data: communitiesData, isLoading: communitiesLoading, refetch } = useUserCommunities(
    ownerId || 0,
    1,
    !!ownerId && !!user
  )
  
  const joinMutation = useJoinCommunity()
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // If not logged in, redirect to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [authLoading, user, router])

  // If they have a shared community, redirect to messages
  useEffect(() => {
    if (sharedData?.has_shared_community && ownerId) {
      router.push(`/messages/${ownerId}`)
    }
  }, [sharedData, ownerId, router])

  const handleJoin = async (communityId: number) => {
    try {
      await joinMutation.mutateAsync(communityId)
      setShowSuccessModal(true)
      // Refresh communities list
      refetch()
    } catch (error: any) {
      showToast('error', translateError(extractErrorMessage(error), t))
    }
  }

  const isLoading = authLoading || cardLoading || sharedLoading || communitiesLoading

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!card) {
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

  // If card owner is the user themselves
  if (user?.id === card.owner.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card variant="bordered" className="p-6 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-neutral-700">{t('cards.detail.cannotMessageSelf')}</p>
          <div className="mt-4">
            <Link href={`/cards/${cardId}`}>
              <Button variant="ghost">{t('cards.joinCommunity.backToCard')}</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const communities = communitiesData?.items || []
  const ownerName = card.owner.first_name && card.owner.last_name
    ? `${card.owner.first_name} ${card.owner.last_name}`
    : t('cards.joinCommunity.cardOwner')

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <Link
          href={`/cards/${cardId}`}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 sm:mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm sm:text-base">{t('cards.joinCommunity.backToCard')}</span>
        </Link>

        {/* Main Card */}
        <Card variant="elevated" className="p-6 sm:p-8 mb-6">
          {/* Header with Warning */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-3">
              {t('cards.joinCommunity.title')}
            </h1>
            <p className="text-neutral-600 font-light leading-relaxed max-w-md mx-auto">
              {t('cards.joinCommunity.description', { name: ownerName })}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-200 my-6"></div>

          {/* Communities List */}
          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {t('cards.joinCommunity.ownersCommunities', { name: ownerName })}
            </h2>

            {communities.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                title={t('cards.joinCommunity.noCommunities')}
                description={t('cards.joinCommunity.noCommunitiesDescription')}
              />
            ) : (
              <div className="space-y-3">
                {communities.map((community) => (
                  <div
                    key={community.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Community Icon */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center flex-shrink-0">
                        {community.avatar ? (
                          <img
                            src={community.avatar.url}
                            alt={community.name}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/communities/${community.id}`}
                            className="font-medium text-neutral-900 hover:text-primary-600 transition-colors truncate"
                          >
                            {community.name}
                          </Link>
                          {community.is_member && (
                            <Badge variant="success" size="sm">{t('cards.joinCommunity.memberBadge')}</Badge>
                          )}
                          {community.has_pending_request && !community.is_member && (
                            <Badge variant="warning" size="sm">{t('cards.joinCommunity.pendingBadge')}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-neutral-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {t('communities.detail.members', { count: (community.member_count || 0).toString() })}
                          </span>
                          <code className="text-xs font-mono bg-neutral-100 px-1.5 py-0.5 rounded" dir="ltr">
                            @{community.slug}
                          </code>
                        </div>
                        {community.bio && (
                          <p className="text-sm text-neutral-600 font-light mt-1 line-clamp-1">
                            {community.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {community.is_member ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-medium">{t('cards.joinCommunity.youAreMember')}</span>
                        </div>
                      ) : community.has_pending_request ? (
                        <Button variant="secondary" size="sm" disabled className="w-full sm:w-auto">
                          <svg className="w-4 h-4 ltr:mr-1.5 rtl:ml-1.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {t('cards.joinCommunity.requestPending')}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleJoin(community.id)}
                          isLoading={joinMutation.isPending}
                          className="w-full sm:w-auto"
                        >
                          <svg className="w-4 h-4 ltr:mr-1.5 rtl:ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          {t('cards.joinCommunity.requestMembership')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Info Box */}
        <Card variant="bordered" className="p-4 sm:p-5 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">{t('cards.joinCommunity.infoTitle')}</h3>
              <p className="text-sm text-blue-700 font-light leading-relaxed">
                {t('cards.joinCommunity.infoDescription')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={t('cards.joinCommunity.requestSentTitle')}
        size="sm"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-neutral-700 mb-6">
            {t('cards.joinCommunity.requestSentMessage')}
          </p>
          <Button onClick={() => setShowSuccessModal(false)} className="w-full">
            {t('common.ok')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
