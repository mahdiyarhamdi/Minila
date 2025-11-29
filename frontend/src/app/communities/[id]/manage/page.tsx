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
} from '@/hooks/useCommunities'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import Tabs from '@/components/Tabs'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'

/**
 * صفحه مدیریت کامیونیتی (فقط برای Manager)
 * طراحی Mobile-First با layout واکنش‌گرا
 */
export default function ManageCommunityPage({ params }: { params: { id: string } }) {
  const communityId = parseInt(params.id)
  const router = useRouter()
  const { showToast } = useToast()
  
  // ابتدا اطلاعات کامیونیتی و دسترسی را بررسی می‌کنیم
  const { data: community, isLoading, refetch: refetchCommunity } = useCommunity(communityId)
  
  // بررسی دسترسی - فقط owner یا manager می‌توانند مدیریت کنند
  const hasManageAccess = community?.my_role === 'manager' || community?.my_role === 'owner'
  
  // فقط در صورت داشتن دسترسی، داده‌های مدیریت را fetch می‌کنیم
  const { data: requests, refetch: refetchRequests } = useJoinRequests(communityId, 1, hasManageAccess)
  const { data: members, refetch: refetchMembers } = useCommunityMembers(communityId, 1, hasManageAccess)
  
  const approveMutation = useApproveJoinRequest()
  const rejectMutation = useRejectJoinRequest()
  const removeMutation = useRemoveCommunityMember()
  const changeRoleMutation = useChangeMemberRole()
  const [activeTab, setActiveTab] = useState('requests')
  const [removeMemberId, setRemoveMemberId] = useState<number | null>(null)
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ userId: number; currentRole: string; userName: string } | null>(null)
  
  // Force refresh داده‌های کامیونیتی هنگام ورود به صفحه برای بررسی دسترسی
  useEffect(() => {
    refetchCommunity()
  }, [communityId, refetchCommunity])

  // بررسی وجود token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (!token) {
        showToast('error', 'لطفاً ابتدا وارد شوید')
        router.push('/auth/login')
      }
    }
  }, [router, showToast])

  const handleApprove = async (requestId: number) => {
    try {
      await approveMutation.mutateAsync({ communityId, requestId })
      showToast('success', 'درخواست تایید شد')
    } catch (error: any) {
      showToast('error', extractErrorMessage(error))
    }
  }

  const handleReject = async (requestId: number) => {
    try {
      await rejectMutation.mutateAsync({ communityId, requestId })
      showToast('success', 'درخواست رد شد')
    } catch (error: any) {
      showToast('error', extractErrorMessage(error))
    }
  }

  const handleRemoveMember = async () => {
    if (!removeMemberId) return

    try {
      await removeMutation.mutateAsync({ communityId, userId: removeMemberId })
      showToast('success', 'عضو از کامیونیتی حذف شد')
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
      showToast('success', newRole === 'manager' ? 'کاربر به مدیر ارتقا یافت' : 'نقش کاربر به عضو تغییر کرد')
      setRoleChangeTarget(null)
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
          <p className="text-red-600 text-center">کامیونیتی یافت نشد</p>
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
    
    // تعیین پیام اصلی بر اساس وضعیت
    let mainMessage = 'لطفاً ابتدا وارد شوید'
    let subMessage = 'برای دسترسی به صفحه مدیریت، ابتدا باید وارد حساب کاربری خود شوید.'
    
    if (isTokenExpired) {
      mainMessage = 'نشست شما منقضی شده است'
      subMessage = 'لطفاً دوباره وارد حساب کاربری خود شوید تا بتوانید به صفحه مدیریت دسترسی داشته باشید.'
    } else if (isMemberWithoutAccess) {
      mainMessage = 'شما دسترسی به مدیریت این کامیونیتی را ندارید'
      subMessage = 'شما عضو این کامیونیتی هستید اما نقش مدیریتی (owner یا manager) ندارید.'
    } else if (hasToken) {
      mainMessage = 'شما دسترسی به مدیریت این کامیونیتی را ندارید'
      subMessage = 'شما عضو این کامیونیتی نیستید یا نقش مدیریتی ندارید.'
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
                  ورود به حساب کاربری
                </Button>
              </Link>
            )}
            
            <Link href={`/communities/${communityId}`} className="w-full">
              <Button variant="ghost" className="w-full">بازگشت به کامیونیتی</Button>
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
          <span className="text-sm sm:text-base">بازگشت به کامیونیتی</span>
        </Link>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
            مدیریت {community.name}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-light">
            مدیریت درخواست‌ها و اعضای کامیونیتی
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'requests', label: 'درخواست‌های عضویت', count: pendingRequests.length },
            { id: 'members', label: 'اعضا', count: members?.total },
            { id: 'settings', label: 'تنظیمات' },
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
                      {/* اطلاعات کاربر */}
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
                            {new Date(request.created_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                      </div>
                      
                      {/* دکمه‌های اکشن */}
                      <div className="flex gap-2 mr-13 sm:mr-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleApprove(request.id)}
                          isLoading={approveMutation.isPending}
                          className="flex-1 sm:flex-none"
                        >
                          تایید
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(request.id)}
                          isLoading={rejectMutation.isPending}
                          className="flex-1 sm:flex-none"
                        >
                          رد
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="درخواستی یافت نشد"
                  description="درخواست عضویت جدیدی وجود ندارد"
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
                    
                    // owner می‌تواند همه را مدیریت کند (به جز خودش/owner دیگر)
                    // manager فقط می‌تواند member ها را حذف کند
                    const canManageThisMember = (isCurrentUserOwner && !isOwner) || (isCurrentUserManager && isMember)
                    const canChangeRole = isCurrentUserOwner && !isOwner // فقط owner می‌تواند نقش را تغییر دهد
                    
                    return (
                      <div
                        key={member.id}
                        className="flex flex-col gap-3 p-3 sm:p-4 rounded-lg hover:bg-neutral-50 border border-neutral-100 transition-colors"
                      >
                        {/* ردیف اول: اطلاعات کاربر و Badge */}
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
                            {isOwner ? 'مالک' : isManager ? 'مدیر' : 'عضو'}
                          </Badge>
                        </div>
                        
                        {/* ردیف دوم: دکمه‌های مدیریت (فقط اگر دسترسی داشته باشد) */}
                        {(canChangeRole || canManageThisMember) && (
                          <div className="flex flex-wrap gap-2 pr-13 sm:pr-0 sm:justify-end">
                            {/* دکمه‌های تغییر نقش - فقط برای owner */}
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
                                ارتقا به مدیر
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
                                تنزل به عضو
                              </Button>
                            )}
                            {/* دکمه حذف - برای owner و manager */}
                            {canManageThisMember && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50 text-xs sm:text-sm"
                                onClick={() => setRemoveMemberId(member.user.id)}
                              >
                                حذف
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState title="عضوی یافت نشد" />
              )}
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Card variant="bordered" className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-3 sm:mb-4">تنظیمات کامیونیتی</h3>
              <p className="text-sm sm:text-base text-neutral-600 font-light">
                تنظیمات بیشتر به زودی اضافه خواهد شد...
              </p>
            </Card>
          )}
        </Tabs>
      </div>

      {/* Remove Member Modal */}
      <Modal
        isOpen={removeMemberId !== null}
        onClose={() => setRemoveMemberId(null)}
        title="حذف عضو"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-700 text-sm sm:text-base">
            آیا از حذف این عضو از کامیونیتی اطمینان دارید؟
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button variant="ghost" onClick={() => setRemoveMemberId(null)} className="w-full sm:w-auto">
              انصراف
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              onClick={handleRemoveMember}
              isLoading={removeMutation.isPending}
            >
              حذف عضو
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        isOpen={roleChangeTarget !== null}
        onClose={() => setRoleChangeTarget(null)}
        title={roleChangeTarget?.currentRole === 'member' ? 'ارتقا به مدیر' : 'تنزل به عضو'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-700 text-sm sm:text-base">
            {roleChangeTarget?.currentRole === 'member' 
              ? `آیا می‌خواهید ${roleChangeTarget?.userName} را به مدیر ارتقا دهید؟`
              : `آیا می‌خواهید نقش ${roleChangeTarget?.userName} را به عضو عادی تنزل دهید؟`
            }
          </p>
          
          {roleChangeTarget?.currentRole === 'member' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs sm:text-sm text-blue-800">
              <p className="font-medium mb-1">مدیران می‌توانند:</p>
              <ul className="list-disc list-inside space-y-1 mr-2">
                <li>درخواست‌های عضویت را تایید یا رد کنند</li>
                <li>اعضای عادی را از کامیونیتی حذف کنند</li>
              </ul>
            </div>
          )}
          
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button variant="ghost" onClick={() => setRoleChangeTarget(null)} className="w-full sm:w-auto">
              انصراف
            </Button>
            <Button
              variant={roleChangeTarget?.currentRole === 'member' ? 'primary' : 'secondary'}
              onClick={() => handleChangeRole(roleChangeTarget?.currentRole === 'member' ? 'manager' : 'member')}
              isLoading={changeRoleMutation.isPending}
              className="w-full sm:w-auto"
            >
              {roleChangeTarget?.currentRole === 'member' ? 'ارتقا به مدیر' : 'تنزل به عضو'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
