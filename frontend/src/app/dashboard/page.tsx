'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
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
  const { data: joinRequests, isLoading: requestsLoading } = useMyJoinRequests()
  const { data: managedRequests, isLoading: managedRequestsLoading } = useManagedCommunityRequests()
  const { data: myCards } = useMyCards()
  const { data: myCommunities } = useMyCommunities()
  const { data: unreadCount } = useUnreadCount()
  const cancelRequestMutation = useCancelJoinRequest()
  const approveRequestMutation = useApproveJoinRequest()
  const rejectRequestMutation = useRejectJoinRequest()
  const { showToast } = useToast()

  // State برای تب درخواست‌ها
  const [requestsTab, setRequestsTab] = useState<'my' | 'managed'>('my')

  // State برای فرم تغییر رمز عبور
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  
  // State برای لغو درخواست
  const [cancelRequestId, setCancelRequestId] = useState<number | null>(null)
  const [cancelCommunityName, setCancelCommunityName] = useState('')
  
  // State برای تایید/رد درخواست عضویت
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
      showToast('success', 'درخواست عضویت لغو شد')
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
        showToast('success', `درخواست ${actionRequest.userName} تایید شد`)
      } else {
        await rejectRequestMutation.mutateAsync({
          communityId: actionRequest.communityId,
          requestId: actionRequest.id
        })
        showToast('success', `درخواست ${actionRequest.userName} رد شد`)
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

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('لطفاً همه فیلدها را پر کنید')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('رمز عبور جدید باید حداقل 8 کاراکتر باشد')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('رمز عبور جدید و تکرار آن یکسان نیستند')
      return
    }

    if (oldPassword === newPassword) {
      setPasswordError('رمز عبور جدید نباید با رمز عبور فعلی یکسان باشد')
      return
    }

    setPasswordLoading(true)

    try {
      await apiService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      })

      setPasswordSuccess('رمز عبور با موفقیت تغییر کرد')
      // پاک کردن فیلدها
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
            خوش آمدید، {user.first_name}!
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 font-light">
            از داشبورد خود می‌توانید کارت‌ها را مدیریت کنید و پیام‌های خود را مشاهده کنید.
          </p>
        </div>

        {/* کارت‌های اطلاعاتی */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/dashboard/my-cards">
            <Card variant="bordered" className="p-6 hover:shadow-medium transition-shadow cursor-pointer">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">کارت‌های من</h3>
              <p className="text-3xl font-extrabold text-primary-600">{myCards?.total ?? 0}</p>
              <p className="text-sm text-neutral-600 font-light mt-2">کارت فعال</p>
            </Card>
          </Link>

          <Link href="/messages">
            <Card variant="bordered" className="p-6 hover:shadow-medium transition-shadow cursor-pointer">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">پیام‌های دریافتی</h3>
              <p className="text-3xl font-extrabold text-sand-400">{unreadCount ?? 0}</p>
              <p className="text-sm text-neutral-600 font-light mt-2">پیام جدید</p>
            </Card>
          </Link>

          <Link href="/dashboard/my-communities">
            <Card variant="bordered" className="p-6 hover:shadow-medium transition-shadow cursor-pointer">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">کامیونیتی‌ها</h3>
              <p className="text-3xl font-extrabold text-neutral-700">{myCommunities?.total ?? 0}</p>
              <p className="text-sm text-neutral-600 font-light mt-2">عضویت فعال</p>
            </Card>
          </Link>
        </div>

        {/* اکشن‌ها */}
        <Card variant="elevated" className="p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">شروع سریع</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/cards/new">
              <div className="p-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary-500 hover:bg-primary-50 transition-all text-right cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary-100">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-1">ایجاد کارت جدید</h4>
                    <p className="text-sm text-neutral-600 font-light">یک کارت سفر یا بار جدید بسازید</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/communities">
              <div className="p-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-sand-400 hover:bg-sand-50 transition-all text-right cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-sand-100">
                    <svg className="w-6 h-6 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-1">پیوستن به کامیونیتی</h4>
                    <p className="text-sm text-neutral-600 font-light">به یک کامیونیتی بپیوندید یا کامیونیتی جدید بسازید</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </Card>

        {/* درخواست‌های عضویت */}
        <Card variant="bordered" className="mt-6 p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">درخواست‌های عضویت</h3>
          
          <Tabs
            tabs={[
              { id: 'my', label: 'درخواست‌های من', count: joinRequests?.filter(r => r.is_approved === null).length },
              { id: 'managed', label: 'درخواست‌های کامیونیتی‌ها', count: managedRequests?.length },
            ]}
            activeTab={requestsTab}
            onChange={(tab) => setRequestsTab(tab as 'my' | 'managed')}
          >
            {/* تب درخواست‌های من */}
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
                    <p className="text-neutral-600 font-light mb-4">شما هیچ درخواست عضویتی ندارید</p>
                    <Link href="/communities">
                      <Button variant="ghost">مشاهده کامیونیتی‌ها</Button>
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
                              {new Date(request.created_at).toLocaleDateString('fa-IR')}
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
                              ? 'در انتظار' 
                              : request.is_approved 
                                ? 'تایید شده ✓' 
                                : 'رد شده ✗'}
                          </Badge>
                          {/* دکمه لغو فقط برای درخواست‌های در انتظار */}
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
                              لغو
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* تب درخواست‌های کامیونیتی‌ها (برای owner/manager) */}
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
                    <p className="text-neutral-600 font-light mb-4">درخواست عضویتی برای کامیونیتی‌های شما وجود ندارد</p>
                    <p className="text-sm text-neutral-500">اگر مالک یا مدیر کامیونیتی هستید، درخواست‌های جدید اینجا نمایش داده می‌شوند</p>
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
                              درخواست عضویت در <span className="font-medium">{request.community.name}</span>
                            </p>
                            <p className="text-xs text-neutral-500">
                              {new Date(request.created_at).toLocaleDateString('fa-IR')}
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
                            تایید
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
                            رد
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

        {/* اطلاعات کاربر */}
        <Card variant="bordered" className="mt-6 p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">اطلاعات حساب</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">ایمیل:</span>
              <span className="font-medium text-neutral-900" dir="ltr">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">نام:</span>
              <span className="font-medium text-neutral-900">{user.first_name} {user.last_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">وضعیت ایمیل:</span>
              <span className={`font-medium ${user.is_email_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user.is_email_verified ? 'تایید شده ✓' : 'در انتظار تایید'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-neutral-600 font-light">تاریخ عضویت:</span>
              <span className="font-medium text-neutral-900">
                {new Date(user.created_at).toLocaleDateString('fa-IR')}
              </span>
            </div>
          </div>
        </Card>

        {/* تغییر رمز عبور */}
        <Card variant="bordered" className="mt-6 p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">تغییر رمز عبور</h3>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="old-password" className="block text-sm font-medium text-neutral-700 mb-2">
                رمز عبور فعلی
              </label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="رمز عبور فعلی خود را وارد کنید"
                disabled={passwordLoading}
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-neutral-700 mb-2">
                رمز عبور جدید
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="حداقل 8 کاراکتر"
                disabled={passwordLoading}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-neutral-700 mb-2">
                تکرار رمز عبور جدید
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="رمز عبور جدید را دوباره وارد کنید"
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
              {passwordLoading ? 'در حال تغییر...' : 'تغییر رمز عبور'}
            </Button>
          </form>
        </Card>
      </main>
      
      {/* Modal لغو درخواست عضویت */}
      <Modal
        isOpen={cancelRequestId !== null}
        onClose={() => {
          setCancelRequestId(null)
          setCancelCommunityName('')
        }}
        title="لغو درخواست عضویت"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-700">
            آیا از لغو درخواست عضویت در کامیونیتی <span className="font-medium text-neutral-900">{cancelCommunityName}</span> اطمینان دارید؟
          </p>
          <p className="text-sm text-neutral-500">
            پس از لغو، می‌توانید دوباره درخواست عضویت ارسال کنید.
          </p>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="ghost" 
              onClick={() => {
                setCancelRequestId(null)
                setCancelCommunityName('')
              }}
            >
              انصراف
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCancelRequest}
              isLoading={cancelRequestMutation.isPending}
            >
              لغو درخواست
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal تایید/رد درخواست عضویت */}
      <Modal
        isOpen={actionRequest !== null}
        onClose={() => setActionRequest(null)}
        title={actionRequest?.action === 'approve' ? 'تایید درخواست عضویت' : 'رد درخواست عضویت'}
        size="sm"
      >
        {actionRequest && (
          <div className="space-y-4">
            <p className="text-neutral-700">
              {actionRequest.action === 'approve' ? (
                <>
                  آیا می‌خواهید درخواست عضویت <span className="font-medium text-neutral-900">{actionRequest.userName}</span> در کامیونیتی <span className="font-medium text-neutral-900">{actionRequest.communityName}</span> را تایید کنید؟
                </>
              ) : (
                <>
                  آیا می‌خواهید درخواست عضویت <span className="font-medium text-neutral-900">{actionRequest.userName}</span> در کامیونیتی <span className="font-medium text-neutral-900">{actionRequest.communityName}</span> را رد کنید؟
                </>
              )}
            </p>
            <p className="text-sm text-neutral-500">
              {actionRequest.action === 'approve' 
                ? 'کاربر پس از تایید به‌عنوان عضو به کامیونیتی اضافه می‌شود.'
                : 'کاربر می‌تواند در آینده دوباره درخواست عضویت ارسال کند.'
              }
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="ghost" 
                onClick={() => setActionRequest(null)}
              >
                انصراف
              </Button>
              <Button
                variant="primary"
                className={actionRequest.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                onClick={handleRequestAction}
                isLoading={approveRequestMutation.isPending || rejectRequestMutation.isPending}
              >
                {actionRequest.action === 'approve' ? 'تایید' : 'رد درخواست'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

