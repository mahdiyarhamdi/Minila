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
import Input from '@/components/Input'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import Tabs from '@/components/Tabs'
import { useToast } from '@/components/Toast'
import { apiService } from '@/lib/api'
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

  // State for change password form
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError(t('dashboard.changePassword.errors.fillAll'))
      return
    }

    if (newPassword.length < 8) {
      setPasswordError(t('dashboard.changePassword.errors.minLength'))
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('dashboard.changePassword.errors.mismatch'))
      return
    }

    if (oldPassword === newPassword) {
      setPasswordError(t('dashboard.changePassword.errors.sameAsOld'))
      return
    }

    setPasswordLoading(true)

    try {
      await apiService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      })

      setPasswordSuccess(t('dashboard.changePassword.success'))
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error)
      setPasswordError(errorMessage)
    } finally {
      setPasswordLoading(false)
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

        {/* Account Info */}
        <Card variant="bordered" className="mt-6 p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">{t('dashboard.accountInfo.title')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">{t('dashboard.accountInfo.email')}</span>
              <span className="font-medium text-neutral-900" dir="ltr">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">{t('dashboard.accountInfo.name')}</span>
              <span className="font-medium text-neutral-900">{user.first_name} {user.last_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">{t('dashboard.accountInfo.emailStatus')}</span>
              <span className={`font-medium ${user.is_email_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user.is_email_verified ? t('dashboard.accountInfo.verified') : t('dashboard.accountInfo.pendingVerification')}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-neutral-600 font-light">{t('dashboard.accountInfo.joinDate')}</span>
              <span className="font-medium text-neutral-900">
                {formatDate(user.created_at)}
              </span>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card variant="bordered" className="mt-6 p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">{t('dashboard.changePassword.title')}</h3>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="old-password" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('dashboard.changePassword.currentPassword')}
              </label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t('dashboard.changePassword.currentPasswordPlaceholder')}
                disabled={passwordLoading}
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('dashboard.changePassword.newPassword')}
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('dashboard.changePassword.newPasswordPlaceholder')}
                disabled={passwordLoading}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('dashboard.changePassword.confirmPassword')}
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('dashboard.changePassword.confirmPasswordPlaceholder')}
                disabled={passwordLoading}
              />
            </div>

            {passwordError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-medium">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-600 font-medium">{passwordSuccess}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={passwordLoading}
              className="w-full"
            >
              {passwordLoading ? t('dashboard.changePassword.submitting') : t('dashboard.changePassword.submitButton')}
            </Button>
          </form>
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
