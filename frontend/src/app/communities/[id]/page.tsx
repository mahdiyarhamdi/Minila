'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCommunity, useCommunityMembers, useJoinCommunity } from '@/hooks/useCommunities'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import Tabs from '@/components/Tabs'
import Modal from '@/components/Modal'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'
import { translateError } from '@/lib/errorTranslation'

/**
 * Community detail page
 */
export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const communityId = parseInt(params.id)
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { t, formatDate } = useTranslation()
  const { data: community, isLoading, error } = useCommunity(communityId)
  const { data: membersData } = useCommunityMembers(communityId)
  const joinMutation = useJoinCommunity()
  const [activeTab, setActiveTab] = useState('about')
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleJoin = async () => {
    try {
      await joinMutation.mutateAsync(communityId)
      setShowSuccessModal(true)
    } catch (error: any) {
      showToast('error', translateError(extractErrorMessage(error), t))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card variant="bordered" className="p-6 max-w-md">
          <p className="text-red-600 text-center">{t('communities.detail.notFound')}</p>
          <div className="mt-4 text-center">
            <Link href="/communities">
              <Button variant="ghost">{t('communities.detail.backToList')}</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Check if current user is the owner
  const isOwner = user && community.owner && community.owner.id === user.id
  
  // Check member status from API if available, otherwise use owner check
  const isManager = community.my_role === 'manager' || community.my_role === 'owner' || isOwner
  const isMember = community.is_member || (community.my_role !== null && community.my_role !== undefined) || isOwner

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <Link
          href="/communities"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 sm:mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm sm:text-base">{t('communities.detail.backToList')}</span>
        </Link>

        {/* Header */}
        <Card variant="elevated" className="p-4 sm:p-8 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Icon */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-sand-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 sm:w-10 sm:h-10 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-xl sm:text-3xl font-extrabold text-neutral-900">{community.name}</h1>
                  {isOwner && (
                    <Badge variant="success" size="md">
                      {t('communities.detail.owner')}
                    </Badge>
                  )}
                  {isMember && !isOwner && (
                    <Badge variant="success" size="md">
                      {community.my_role === 'manager' ? t('communities.detail.manager') : t('communities.detail.member')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm sm:text-base text-neutral-600 font-light mb-2 sm:mb-3">{community.bio}</p>
                {/* Community ID */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-neutral-500">@</span>
                  <code className="text-sm font-mono text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded" dir="ltr">
                    {community.slug}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(community.slug)
                      showToast('success', t('communities.detail.idCopied'))
                    }}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    title={t('communities.detail.copyId')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    {t('communities.detail.members', { count: (community.member_count || 0).toString() })}
                  </span>
                  <span className="font-light">
                    {t('communities.detail.createdBy')} {community.owner.first_name} {community.owner.last_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {(isManager || isOwner) && (
                <Link href={`/communities/${community.id}/manage`} className="flex-1 sm:flex-none">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {t('communities.detail.manageButton')}
                  </Button>
                </Link>
              )}
              {!user && (
                <Link href="/auth/login" className="flex-1 sm:flex-none">
                  <Button variant="primary" className="w-full sm:w-auto">
                    {t('communities.detail.loginToJoin')}
                  </Button>
                </Link>
              )}
              {user && !isMember && !isOwner && (
                <Button onClick={handleJoin} isLoading={joinMutation.isPending} className="flex-1 sm:flex-none w-full sm:w-auto">
                  {t('communities.detail.joinButton')}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'about', label: t('communities.detail.aboutTab') },
            { id: 'members', label: t('communities.detail.membersTab'), count: membersData?.total },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        >
          {/* About Tab */}
          {activeTab === 'about' && (
            <Card variant="bordered" className="p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-3">{t('communities.detail.aboutCommunity')}</h3>
              <p className="text-neutral-700 font-light leading-relaxed mb-6">
                {community.bio || t('communities.detail.noDescription')}
              </p>

              <div className="pt-6 border-t border-neutral-200">
                <h4 className="text-sm font-medium text-neutral-600 mb-3">{t('communities.detail.additionalInfo')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-neutral-600">{t('communities.detail.createdAt')}:</span>
                    <p className="font-medium text-neutral-900">
                      {formatDate(community.created_at)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-600">{t('communities.detail.updatedAt')}:</span>
                    <p className="font-medium text-neutral-900">
                      {formatDate(community.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <Card variant="bordered" className="p-6">
              {membersData && membersData.items.length > 0 ? (
                <div className="space-y-3">
                  {membersData.items.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-bold">
                            {member.user.first_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">
                            {member.user.first_name} {member.user.last_name}
                          </p>
                          <p className="text-sm text-neutral-600 font-light" dir="ltr">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant={member.role.name === 'manager' ? 'success' : 'neutral'}>
                        {member.role.name === 'manager' 
                          ? t('communities.detail.manager') 
                          : member.role.name === 'moderator' 
                            ? t('communities.detail.moderator') 
                            : t('communities.detail.member')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={t('communities.detail.noMembers')}
                  description={t('communities.detail.noMembersDescription')}
                />
              )}
            </Card>
          )}
        </Tabs>
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
