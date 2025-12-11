'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import { useMyJoinRequests, useCancelJoinRequest, useMyCommunities, useManagedCommunityRequests, useApproveJoinRequest, useRejectJoinRequest } from '@/hooks/useCommunities'
import { useMyCards } from '@/hooks/useCards'
import { useUnreadCount } from '@/hooks/useMessages'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Badge from '@/components/Badge'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import Tabs from '@/components/Tabs'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const { t, formatDate } = useTranslation()
  const { data: joinRequests, isLoading: requestsLoading } = useMyJoinRequests()
  const { data: managedRequests, isLoading: managedRequestsLoading } = useManagedCommunityRequests()
  const { data: myCards } = useMyCards()
  const { data: myCommunities } = useMyCommunities()
  const { data: unreadCount } = useUnreadCount()
  const cancelRequestMutation = useCancelJoinRequest()
  const approveRequestMutation = useApproveJoinRequest()
  const rejectRequestMutation = useRejectJoinRequest()
  const { showToast } = useToast()

  // State for requests tab
  const [requestsTab, setRequestsTab] = useState<'my' | 'managed'>('my')
  
  // State for cancel request modal
  const [cancelRequestId, setCancelRequestId] = useState<number | null>(null)
  const [cancelCommunityName, setCancelCommunityName] = useState('')
  
  // State for approve/reject request modal
  const [actionRequest, setActionRequest] = useState<{
    id: number
    communityId: number
    userName: string
    communityName: string
    action: 'approve' | 'reject'
  } | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])
  
  const handleCancelRequest = async () => {
    if (!cancelRequestId) return
    
    try {
      await cancelRequestMutation.mutateAsync(cancelRequestId)
      showToast('success', t('dashboard.joinRequests.cancelRequest'))
      setCancelRequestId(null)
      setCancelCommunityName('')
    } catch (error: unknown) {
      showToast('error', extractErrorMessage(error))
    }
  }

  const handleRequestAction = async () => {
    if (!actionRequest) return
    
    try {
      if (actionRequest.action === 'approve') {
        await approveRequestMutation.mutateAsync({
          communityId: actionRequest.communityId,
          requestId: actionRequest.id
        })
        showToast('success', `${t('dashboard.joinRequests.approve')} - ${actionRequest.userName}`)
      } else {
        await rejectRequestMutation.mutateAsync({
          communityId: actionRequest.communityId,
          requestId: actionRequest.id
        })
        showToast('success', `${t('dashboard.joinRequests.reject')} - ${actionRequest.userName}`)
      }
      setActionRequest(null)
    } catch (error: unknown) {
      showToast('error', extractErrorMessage(error))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
            {t('dashboard.welcome', { name: user.first_name })}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 font-light">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Tutorial Section */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 via-white to-sand-50 border border-primary-100">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-sand-100/40 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <div className="relative p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
                {t('dashboard.tutorial.title')}
              </h3>
              <p className="text-sm text-neutral-600 font-light">
                {t('dashboard.tutorial.subtitle')}
              </p>
            </div>

            {/* Steps with connecting arrows */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 relative items-stretch">
              {/* Step 1 */}
              <Link href="/communities" className="group h-full">
                <div className="relative flex flex-col items-center text-center p-5 pt-6 rounded-2xl bg-white shadow-sm border border-neutral-100 hover:border-primary-300 hover:shadow-lg transition-all duration-300 h-full">
                  {/* Step number badge */}
                  <div className="absolute -top-4 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg ring-4 ring-white">
                    <span className="text-white text-sm font-bold">{t('dashboard.tutorial.steps.step1.number')}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className="mt-2 mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  
                  <h4 className="font-bold text-neutral-900 text-sm mb-1.5">
                    {t('dashboard.tutorial.steps.step1.title')}
                  </h4>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">
                    {t('dashboard.tutorial.steps.step1.description')}
                  </p>
                </div>
              </Link>

              {/* Arrow 1 - Desktop only */}
              <div className="hidden md:flex absolute top-1/2 ltr:left-[22%] rtl:right-[22%] -translate-y-1/2 items-center justify-center w-8 pointer-events-none">
                <svg className="w-6 h-6 text-primary-300 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Step 2 */}
              <Link href="/cards/new" className="group h-full">
                <div className="relative flex flex-col items-center text-center p-5 pt-6 rounded-2xl bg-white shadow-sm border border-neutral-100 hover:border-sand-300 hover:shadow-lg transition-all duration-300 h-full">
                  {/* Step number badge */}
                  <div className="absolute -top-4 w-8 h-8 rounded-full bg-gradient-to-br from-sand-400 to-sand-500 flex items-center justify-center shadow-lg ring-4 ring-white">
                    <span className="text-white text-sm font-bold">{t('dashboard.tutorial.steps.step2.number')}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className="mt-2 mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-sand-100 to-sand-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <svg className="w-8 h-8 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  
                  <h4 className="font-bold text-neutral-900 text-sm mb-1.5">
                    {t('dashboard.tutorial.steps.step2.title')}
                  </h4>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">
                    {t('dashboard.tutorial.steps.step2.description')}
                  </p>
                </div>
              </Link>

              {/* Arrow 2 - Desktop only */}
              <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center w-8 pointer-events-none">
                <svg className="w-6 h-6 text-sand-300 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Step 3 */}
              <Link href="/cards" className="group h-full">
                <div className="relative flex flex-col items-center text-center p-5 pt-6 rounded-2xl bg-white shadow-sm border border-neutral-100 hover:border-primary-300 hover:shadow-lg transition-all duration-300 h-full">
                  {/* Step number badge */}
                  <div className="absolute -top-4 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg ring-4 ring-white">
                    <span className="text-white text-sm font-bold">{t('dashboard.tutorial.steps.step3.number')}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className="mt-2 mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  <h4 className="font-bold text-neutral-900 text-sm mb-1.5">
                    {t('dashboard.tutorial.steps.step3.title')}
                  </h4>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">
                    {t('dashboard.tutorial.steps.step3.description')}
                  </p>
                </div>
              </Link>

              {/* Arrow 3 - Desktop only */}
              <div className="hidden md:flex absolute top-1/2 ltr:right-[22%] rtl:left-[22%] -translate-y-1/2 items-center justify-center w-8 pointer-events-none">
                <svg className="w-6 h-6 text-primary-300 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Step 4 */}
              <Link href="/messages" className="group h-full">
                <div className="relative flex flex-col items-center text-center p-5 pt-6 rounded-2xl bg-white shadow-sm border border-neutral-100 hover:border-sand-300 hover:shadow-lg transition-all duration-300 h-full">
                  {/* Step number badge */}
                  <div className="absolute -top-4 w-8 h-8 rounded-full bg-gradient-to-br from-sand-400 to-sand-500 flex items-center justify-center shadow-lg ring-4 ring-white">
                    <span className="text-white text-sm font-bold">{t('dashboard.tutorial.steps.step4.number')}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className="mt-2 mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-sand-100 to-sand-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <svg className="w-8 h-8 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  
                  <h4 className="font-bold text-neutral-900 text-sm mb-1.5">
                    {t('dashboard.tutorial.steps.step4.title')}
                  </h4>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">
                    {t('dashboard.tutorial.steps.step4.description')}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/dashboard/my-cards">
            <Card variant="bordered" className="p-6 hover:shadow-medium transition-shadow cursor-pointer">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">{t('dashboard.myCards')}</h3>
              <p className="text-3xl font-extrabold text-primary-600">{myCards?.total ?? 0}</p>
              <p className="text-sm text-neutral-600 font-light mt-2">{t('dashboard.activeCards')}</p>
            </Card>
          </Link>

          <Link href="/messages">
            <Card variant="bordered" className="p-6 hover:shadow-medium transition-shadow cursor-pointer">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">{t('dashboard.receivedMessages')}</h3>
              <p className="text-3xl font-extrabold text-sand-400">{unreadCount ?? 0}</p>
              <p className="text-sm text-neutral-600 font-light mt-2">{t('dashboard.newMessages')}</p>
            </Card>
          </Link>

          <Link href="/dashboard/my-communities">
            <Card variant="bordered" className="p-6 hover:shadow-medium transition-shadow cursor-pointer">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">{t('dashboard.myCommunities')}</h3>
              <p className="text-3xl font-extrabold text-neutral-700">{myCommunities?.total ?? 0}</p>
              <p className="text-sm text-neutral-600 font-light mt-2">{t('dashboard.activeMemberships')}</p>
            </Card>
          </Link>
        </div>

        {/* Quick Start */}
        <Card variant="elevated" className="p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">{t('dashboard.quickStart.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/cards/new">
              <div className="p-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary-100">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-1">{t('dashboard.quickStart.createCard.title')}</h4>
                    <p className="text-sm text-neutral-600 font-light">{t('dashboard.quickStart.createCard.description')}</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/communities">
              <div className="p-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-sand-400 hover:bg-sand-50 transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-sand-100">
                    <svg className="w-6 h-6 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-1">{t('dashboard.quickStart.joinCommunity.title')}</h4>
                    <p className="text-sm text-neutral-600 font-light">{t('dashboard.quickStart.joinCommunity.description')}</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </Card>

        {/* Join Requests */}
        <Card variant="bordered" className="mt-6 p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">{t('dashboard.joinRequests.title')}</h3>
          
          <Tabs
            tabs={[
              { id: 'my', label: t('dashboard.joinRequests.myRequests'), count: joinRequests?.filter(r => r.is_approved === null).length },
              { id: 'managed', label: t('dashboard.joinRequests.managedRequests'), count: managedRequests?.length },
            ]}
            activeTab={requestsTab}
            onChange={(tab) => setRequestsTab(tab as 'my' | 'managed')}
          >
            {/* My Requests Tab */}
            {requestsTab === 'my' && (
              <>
                {requestsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : !joinRequests || joinRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-neutral-600 font-light mb-4">{t('dashboard.joinRequests.noRequests')}</p>
                    <Link href="/communities">
                      <Button variant="ghost">{t('dashboard.joinRequests.viewCommunities')}</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {joinRequests.map((request) => (
                      <div 
                        key={request.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all"
                      >
                        <Link 
                          href={`/communities/${request.community.id}`}
                          className="flex items-center gap-3 flex-1"
                        >
                          <div className="w-12 h-12 rounded-full bg-sand-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{request.community.name}</p>
                            <p className="text-sm text-neutral-600 font-light">
                              {formatDate(request.created_at)}
                            </p>
                          </div>
                        </Link>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={
                              request.is_approved === null 
                                ? 'neutral' 
                                : request.is_approved 
                                  ? 'success' 
                                  : 'error'
                            }
                          >
                            {request.is_approved === null 
                              ? t('dashboard.joinRequests.pending')
                              : request.is_approved 
                                ? t('dashboard.joinRequests.approved')
                                : t('dashboard.joinRequests.rejected')}
                          </Badge>
                          {request.is_approved === null && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.preventDefault()
                                setCancelRequestId(request.id)
                                setCancelCommunityName(request.community.name)
                              }}
                            >
                              {t('dashboard.joinRequests.cancelRequest')}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Managed Requests Tab */}
            {requestsTab === 'managed' && (
              <>
                {managedRequestsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : !managedRequests || managedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-neutral-600 font-light mb-4">{t('dashboard.joinRequests.noManagedRequests')}</p>
                    <p className="text-sm text-neutral-500">{t('dashboard.joinRequests.managedRequestsHint')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {managedRequests.map((request) => (
                      <div 
                        key={request.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:border-sand-300 hover:bg-sand-50/30 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 font-bold text-lg">
                              {request.user.first_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">
                              {request.user.first_name} {request.user.last_name}
                            </p>
                            <p className="text-sm text-neutral-600 font-light">
                              {t('dashboard.joinRequests.membershipRequest')} <span className="font-medium">{request.community.name}</span>
                            </p>
                            <p className="text-xs text-neutral-500">
                              {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setActionRequest({
                              id: request.id,
                              communityId: request.community.id,
                              userName: `${request.user.first_name} ${request.user.last_name}`,
                              communityName: request.community.name,
                              action: 'approve'
                            })}
                          >
                            {t('dashboard.joinRequests.approve')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setActionRequest({
                              id: request.id,
                              communityId: request.community.id,
                              userName: `${request.user.first_name} ${request.user.last_name}`,
                              communityName: request.community.name,
                              action: 'reject'
                            })}
                          >
                            {t('dashboard.joinRequests.reject')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Tabs>
        </Card>
      </main>
      
      {/* Cancel Request Modal */}
      <Modal
        isOpen={cancelRequestId !== null}
        onClose={() => {
          setCancelRequestId(null)
          setCancelCommunityName('')
        }}
        title={t('dashboard.modals.cancelRequest.title')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-700">
            {t('dashboard.modals.cancelRequest.message', { community: cancelCommunityName })}
          </p>
          <p className="text-sm text-neutral-500">
            {t('dashboard.modals.cancelRequest.note')}
          </p>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="ghost" 
              onClick={() => {
                setCancelRequestId(null)
                setCancelCommunityName('')
              }}
            >
              {t('dashboard.modals.cancelRequest.cancel')}
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCancelRequest}
              isLoading={cancelRequestMutation.isPending}
            >
              {t('dashboard.modals.cancelRequest.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve/Reject Request Modal */}
      <Modal
        isOpen={actionRequest !== null}
        onClose={() => setActionRequest(null)}
        title={actionRequest?.action === 'approve' ? t('dashboard.modals.approveRequest.title') : t('dashboard.modals.rejectRequest.title')}
        size="sm"
      >
        {actionRequest && (
          <div className="space-y-4">
            <p className="text-neutral-700">
              {actionRequest.action === 'approve' 
                ? t('dashboard.modals.approveRequest.message', { user: actionRequest.userName, community: actionRequest.communityName })
                : t('dashboard.modals.rejectRequest.message', { user: actionRequest.userName, community: actionRequest.communityName })
              }
            </p>
            <p className="text-sm text-neutral-500">
              {actionRequest.action === 'approve' 
                ? t('dashboard.modals.approveRequest.note')
                : t('dashboard.modals.rejectRequest.note')
              }
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="ghost" 
                onClick={() => setActionRequest(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                className={actionRequest.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                onClick={handleRequestAction}
                isLoading={approveRequestMutation.isPending || rejectRequestMutation.isPending}
              >
                {actionRequest.action === 'approve' ? t('dashboard.joinRequests.approve') : t('dashboard.joinRequests.reject')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
