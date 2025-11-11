'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  useCommunity,
  useJoinRequests,
  useCommunityMembers,
  useApproveJoinRequest,
  useRejectJoinRequest,
  useRemoveCommunityMember,
} from '@/hooks/useCommunities'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import Tabs from '@/components/Tabs'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'

/**
 * صفحه مدیریت کامیونیتی (فقط برای Manager)
 */
export default function ManageCommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const communityId = parseInt(resolvedParams.id)
  const { showToast } = useToast()
  const { data: community, isLoading } = useCommunity(communityId)
  const { data: requests } = useJoinRequests(communityId)
  const { data: members } = useCommunityMembers(communityId)
  const approveMutation = useApproveJoinRequest()
  const rejectMutation = useRejectJoinRequest()
  const removeMutation = useRemoveCommunityMember()
  const [activeTab, setActiveTab] = useState('requests')
  const [removeMemberId, setRemoveMemberId] = useState<number | null>(null)

  const handleApprove = async (requestId: number) => {
    try {
      await approveMutation.mutateAsync({ communityId, requestId })
      showToast('success', 'درخواست تایید شد')
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'خطا در تایید درخواست')
    }
  }

  const handleReject = async (requestId: number) => {
    try {
      await rejectMutation.mutateAsync({ communityId, requestId })
      showToast('success', 'درخواست رد شد')
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'خطا در رد درخواست')
    }
  }

  const handleRemoveMember = async () => {
    if (!removeMemberId) return

    try {
      await removeMutation.mutateAsync({ communityId, userId: removeMemberId })
      showToast('success', 'عضو از کامیونیتی حذف شد')
      setRemoveMemberId(null)
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'خطا در حذف عضو')
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card variant="bordered" className="p-6 max-w-md">
          <p className="text-red-600 text-center">کامیونیتی یافت نشد</p>
        </Card>
      </div>
    )
  }

  // Check if user is manager
  if (community.my_role !== 'manager') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card variant="bordered" className="p-6 max-w-md text-center">
          <p className="text-red-600 mb-4">شما دسترسی به مدیریت این کامیونیتی را ندارید</p>
          <Link href={`/communities/${communityId}`}>
            <Button variant="ghost">بازگشت به کامیونیتی</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const pendingRequests = requests?.items.filter((r) => r.status === 'pending') || []

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href={`/communities/${communityId}`}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          بازگشت به کامیونیتی
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">
            مدیریت {community.name}
          </h1>
          <p className="text-neutral-600 font-light">
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
            <Card variant="bordered" className="p-6">
              {pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-bold">
                            {request.user.first_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">
                            {request.user.first_name} {request.user.last_name}
                          </p>
                          <p className="text-sm text-neutral-600 font-light">
                            {new Date(request.created_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleApprove(request.id)}
                          isLoading={approveMutation.isPending}
                        >
                          تایید
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(request.id)}
                          isLoading={rejectMutation.isPending}
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
            <Card variant="bordered" className="p-6">
              {members && members.items.length > 0 ? (
                <div className="space-y-3">
                  {members.items.map((member) => (
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
                      <div className="flex items-center gap-3">
                        <Badge variant={member.role === 'manager' ? 'success' : 'neutral'}>
                          {member.role === 'manager'
                            ? 'مدیر'
                            : member.role === 'moderator'
                            ? 'ناظر'
                            : 'عضو'}
                        </Badge>
                        {member.role !== 'manager' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRemoveMemberId(member.user_id)}
                          >
                            حذف
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="عضوی یافت نشد" />
              )}
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Card variant="bordered" className="p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">تنظیمات کامیونیتی</h3>
              <p className="text-neutral-600 font-light">
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
          <p className="text-neutral-700">
            آیا از حذف این عضو از کامیونیتی اطمینان دارید؟
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setRemoveMemberId(null)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              onClick={handleRemoveMember}
              isLoading={removeMutation.isPending}
            >
              حذف عضو
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

