'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useCommunity,
  useJoinRequests,
  useCommunityMembers,
  useApproveJoinRequest,
  useRejectJoinRequest,
  useRemoveCommunityMember,
  useChangeMemberRole,
  useUpdateCommunity,
} from '@/hooks/useCommunities'
import { useTranslation } from '@/hooks/useTranslation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import Tabs from '@/components/Tabs'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'

/**
 * Community management page (Manager only)
 * Mobile-First design with responsive layout
 */
export default function ManageCommunityPage({ params }: { params: { id: string } }) {
  const communityId = parseInt(params.id)
  const router = useRouter()
  const { showToast } = useToast()
  const { t, formatDate } = useTranslation()
  
  // First check community info and access
  const { data: community, isLoading, refetch: refetchCommunity } = useCommunity(communityId)
  
  // Check access - only owner or manager can manage
  const hasManageAccess = community?.my_role === 'manager' || community?.my_role === 'owner'
  
  // Only fetch management data if user has access
  const { data: requests, refetch: refetchRequests } = useJoinRequests(communityId, 1, hasManageAccess)
  const { data: members, refetch: refetchMembers } = useCommunityMembers(communityId, 1, hasManageAccess)
  
  const approveMutation = useApproveJoinRequest()
  const rejectMutation = useRejectJoinRequest()
  const removeMutation = useRemoveCommunityMember()
  const changeRoleMutation = useChangeMemberRole()
  const updateMutation = useUpdateCommunity(communityId)
  const [activeTab, setActiveTab] = useState('requests')
  const [removeMemberId, setRemoveMemberId] = useState<number | null>(null)
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ userId: number; currentRole: string; userName: string } | null>(null)
  
  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
  })
  
  // Initialize settings form when community data loads
  useEffect(() => {
    if (community) {
      setSettingsForm({
        name: community.name || '',
        description: community.description || '',
      })
    }
  }, [community])
  
  // Force refresh community data when entering page to check access
  useEffect(() => {
    refetchCommunity()
  }, [communityId, refetchCommunity])

  // Check for token existence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (!token) {
        showToast('error', t('communities.manage.accessDenied.notLoggedIn'))
        router.push('/auth/login')
      }
    }
  }, [router, showToast, t])

  const handleApprove = async (requestId: number) => {
    try {
      await approveMutation.mutateAsync({ communityId, requestId })
      showToast('success', t('communities.manage.toast.requestApproved'))
    } catch (error: any) {
      showToast('error', extractErrorMessage(error))
    }
  }

  const handleReject = async (requestId: number) => {
    try {
      await rejectMutation.mutateAsync({ communityId, requestId })
      showToast('success', t('communities.manage.toast.requestRejected'))
    } catch (error: any) {
      showToast('error', extractErrorMessage(error))
    }
  }

  const handleRemoveMember = async () => {
    if (!removeMemberId) return

    try {
      await removeMutation.mutateAsync({ communityId, userId: removeMemberId })
      showToast('success', t('communities.manage.toast.memberRemoved'))
      setRemoveMemberId(null)
    } catch (error: any) {
      showToast('error', extractErrorMessage(error))
    }
  }

  const handleChangeRole = async (newRole: 'member' | 'manager') => {
    if (!roleChangeTarget) return

    try {
      await changeRoleMutation.mutateAsync({ 
        communityId, 
        userId: roleChangeTarget.userId, 
        role: newRole 
      })
      showToast('success', newRole === 'manager' 
        ? t('communities.manage.toast.promotedToManager') 
        : t('communities.manage.toast.demotedToMember'))
      setRoleChangeTarget(null)
    } catch (error: any) {
      showToast('error', extractErrorMessage(error))
    }
  }

  const handleSaveSettings = async () => {
    if (!settingsForm.name.trim()) {
      showToast('error', t('communities.manage.settings.nameRequired'))
      return
    }

    try {
      await updateMutation.mutateAsync({
        name: settingsForm.name.trim(),
        description: settingsForm.description.trim() || undefined,
      })
      showToast('success', t('communities.manage.settings.saved'))
      refetchCommunity()
    } catch (error: any) {
      showToast('error', extractErrorMessage(error))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <Card variant="bordered" className="p-6 max-w-md w-full">
          <p className="text-red-600 text-center">{t('communities.detail.notFound')}</p>
        </Card>
      </div>
    )
  }

  // Check if user is manager or owner
  const canManage = hasManageAccess
  
  if (!canManage) {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token')
    const isTokenExpired = community.my_role === null && hasToken
    const isMemberWithoutAccess = community.my_role === 'member' && hasToken
    
    // Determine main message based on status
    let mainMessage = t('communities.manage.accessDenied.notLoggedIn')
    let subMessage = t('communities.manage.accessDenied.notLoggedInDescription')
    
    if (isTokenExpired) {
      mainMessage = t('communities.manage.accessDenied.sessionExpired')
      subMessage = t('communities.manage.accessDenied.sessionExpiredDescription')
    } else if (isMemberWithoutAccess) {
      mainMessage = t('communities.manage.accessDenied.memberNoAccess')
      subMessage = t('communities.manage.accessDenied.memberNoAccessDescription')
    } else if (hasToken) {
      mainMessage = t('communities.manage.accessDenied.noAccess')
      subMessage = t('communities.manage.accessDenied.noAccessDescription')
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <Card variant="bordered" className="p-6 max-w-md w-full text-center">
          <div className={`mb-4 p-4 rounded-lg ${isTokenExpired ? 'bg-amber-50 border border-amber-200' : isMemberWithoutAccess ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-medium mb-2 ${isTokenExpired ? 'text-amber-800' : isMemberWithoutAccess ? 'text-blue-800' : 'text-red-600'}`}>
              {mainMessage}
            </p>
            <p className={`text-sm ${isTokenExpired ? 'text-amber-700' : isMemberWithoutAccess ? 'text-blue-700' : 'text-neutral-600'}`}>
              {subMessage}
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            {(!hasToken || isTokenExpired) && (
              <Link href="/auth/login" className="w-full">
                <Button variant="primary" className="w-full">
                  {t('communities.manage.accessDenied.loginButton')}
                </Button>
              </Link>
            )}
            
            <Link href={`/communities/${communityId}`} className="w-full">
              <Button variant="ghost" className="w-full">{t('communities.manage.accessDenied.backButton')}</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const pendingRequests = requests?.items?.filter((r) => r.status === 'pending') || []

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <Link
          href={`/communities/${communityId}`}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 sm:mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm sm:text-base">{t('communities.manage.backToCommunity')}</span>
        </Link>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
            {t('communities.manage.title', { name: community.name })}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-light">
            {t('communities.manage.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'requests', label: t('communities.manage.requests'), count: pendingRequests.length },
            { id: 'members', label: t('communities.manage.members'), count: members?.total },
            { id: 'settings', label: t('communities.manage.settings') },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        >
          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <Card variant="bordered" className="p-4 sm:p-6">
              {pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-600 font-bold">
                            {request.user.first_name[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 truncate">
                            {request.user.first_name} {request.user.last_name}
                          </p>
                          <p className="text-xs sm:text-sm text-neutral-600 font-light">
                            {formatDate(request.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 ltr:sm:mr-0 rtl:sm:ml-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleApprove(request.id)}
                          isLoading={approveMutation.isPending}
                          className="flex-1 sm:flex-none"
                        >
                          {t('communities.manage.actions.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(request.id)}
                          isLoading={rejectMutation.isPending}
                          className="flex-1 sm:flex-none"
                        >
                          {t('communities.manage.actions.reject')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={t('communities.manage.noRequests')}
                  description={t('communities.manage.noRequestsDescription')}
                />
              )}
            </Card>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <Card variant="bordered" className="p-4 sm:p-6">
              {members && members.items.length > 0 ? (
                <div className="space-y-3">
                  {members.items.map((member) => {
                    const isOwner = member.role.name === 'owner'
                    const isManager = member.role.name === 'manager'
                    const isMember = member.role.name === 'member'
                    const isCurrentUserOwner = community.my_role === 'owner'
                    const isCurrentUserManager = community.my_role === 'manager'
                    
                    // owner can manage everyone (except self/other owners)
                    // manager can only remove members
                    const canManageThisMember = (isCurrentUserOwner && !isOwner) || (isCurrentUserManager && isMember)
                    const canChangeRole = isCurrentUserOwner && !isOwner // only owner can change roles
                    
                    return (
                      <div
                        key={member.id}
                        className="flex flex-col gap-3 p-3 sm:p-4 rounded-lg hover:bg-neutral-50 border border-neutral-100 transition-colors"
                      >
                        {/* First row: User info and Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isOwner ? 'bg-amber-100' : isManager ? 'bg-green-100' : 'bg-primary-100'
                            }`}>
                              <span className={`font-bold ${
                                isOwner ? 'text-amber-600' : isManager ? 'text-green-600' : 'text-primary-600'
                              }`}>
                                {member.user.first_name?.[0] || '?'}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-neutral-900 truncate">
                                {member.user.first_name} {member.user.last_name}
                              </p>
                              <p className="text-xs sm:text-sm text-neutral-600 font-light truncate" dir="ltr">
                                {member.user.email}
                              </p>
                            </div>
                          </div>
                          <Badge variant={isOwner ? 'warning' : isManager ? 'success' : 'neutral'}>
                            {isOwner 
                              ? t('communities.manage.roles.owner') 
                              : isManager 
                                ? t('communities.manage.roles.manager') 
                                : t('communities.manage.roles.member')}
                          </Badge>
                        </div>
                        
                        {/* Second row: Management buttons (only if has access) */}
                        {(canChangeRole || canManageThisMember) && (
                          <div className="flex flex-wrap gap-2 ltr:pr-0 rtl:pl-0 sm:justify-end">
                            {/* Role change buttons - only for owner */}
                            {canChangeRole && isMember && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setRoleChangeTarget({ 
                                  userId: member.user.id, 
                                  currentRole: 'member',
                                  userName: `${member.user.first_name} ${member.user.last_name}`
                                })}
                                className="text-xs sm:text-sm"
                              >
                                {t('communities.manage.actions.makeManager')}
                              </Button>
                            )}
                            {canChangeRole && isManager && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setRoleChangeTarget({ 
                                  userId: member.user.id, 
                                  currentRole: 'manager',
                                  userName: `${member.user.first_name} ${member.user.last_name}`
                                })}
                                className="text-xs sm:text-sm"
                              >
                                {t('communities.manage.actions.demoteToMember')}
                              </Button>
                            )}
                            {/* Remove button - for owner and manager */}
                            {canManageThisMember && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50 text-xs sm:text-sm"
                                onClick={() => setRemoveMemberId(member.user.id)}
                              >
                                {t('communities.manage.actions.removeMember')}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState title={t('communities.manage.noMembers')} />
              )}
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Card variant="bordered" className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-4 sm:mb-6">{t('communities.manage.settings')}</h3>
              
              <div className="space-y-4">
                <Input
                  label={t('communities.manage.settings.name')}
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  placeholder={t('communities.manage.settings.namePlaceholder')}
                  required
                />
                
                <Textarea
                  label={t('communities.manage.settings.description')}
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  placeholder={t('communities.manage.settings.descriptionPlaceholder')}
                  rows={4}
                />
                
                <div className="pt-4">
                  <Button
                    onClick={handleSaveSettings}
                    isLoading={updateMutation.isPending}
                    disabled={!settingsForm.name.trim()}
                  >
                    {t('communities.manage.settings.save')}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </Tabs>
      </div>

      {/* Remove Member Modal */}
      <Modal
        isOpen={removeMemberId !== null}
        onClose={() => setRemoveMemberId(null)}
        title={t('communities.manage.modals.removeMember.title')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-700 text-sm sm:text-base">
            {t('communities.manage.modals.removeMember.message')}
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button variant="ghost" onClick={() => setRemoveMemberId(null)} className="w-full sm:w-auto">
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              onClick={handleRemoveMember}
              isLoading={removeMutation.isPending}
            >
              {t('communities.manage.actions.removeMember')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        isOpen={roleChangeTarget !== null}
        onClose={() => setRoleChangeTarget(null)}
        title={roleChangeTarget?.currentRole === 'member' 
          ? t('communities.manage.modals.promoteToManager.title') 
          : t('communities.manage.modals.demoteToMember.title')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-700 text-sm sm:text-base">
            {roleChangeTarget?.currentRole === 'member' 
              ? t('communities.manage.modals.promoteToManager.message', { name: roleChangeTarget?.userName || '' })
              : t('communities.manage.modals.demoteToMember.message', { name: roleChangeTarget?.userName || '' })
            }
          </p>
          
          {roleChangeTarget?.currentRole === 'member' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs sm:text-sm text-blue-800">
              <p className="font-medium mb-1">{t('communities.manage.modals.promoteToManager.info')}</p>
              <ul className="list-disc ltr:list-inside rtl:mr-4 space-y-1">
                <li>{t('communities.manage.modals.promoteToManager.infoItem1')}</li>
                <li>{t('communities.manage.modals.promoteToManager.infoItem2')}</li>
              </ul>
            </div>
          )}
          
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button variant="ghost" onClick={() => setRoleChangeTarget(null)} className="w-full sm:w-auto">
              {t('common.cancel')}
            </Button>
            <Button
              variant={roleChangeTarget?.currentRole === 'member' ? 'primary' : 'secondary'}
              onClick={() => handleChangeRole(roleChangeTarget?.currentRole === 'member' ? 'manager' : 'member')}
              isLoading={changeRoleMutation.isPending}
              className="w-full sm:w-auto"
            >
              {roleChangeTarget?.currentRole === 'member' 
                ? t('communities.manage.actions.makeManager') 
                : t('communities.manage.actions.demoteToMember')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
