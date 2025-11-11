'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCommunity, useCommunityMembers, useJoinCommunity } from '@/hooks/useCommunities'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import Tabs from '@/components/Tabs'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import { useToast } from '@/components/Toast'

/**
 * صفحه جزئیات کامیونیتی
 */
export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const communityId = parseInt(resolvedParams.id)
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { data: community, isLoading, error } = useCommunity(communityId)
  const { data: membersData } = useCommunityMembers(communityId)
  const joinMutation = useJoinCommunity()
  const [activeTab, setActiveTab] = useState('about')

  const handleJoin = async () => {
    try {
      await joinMutation.mutateAsync(communityId)
      showToast('success', 'درخواست عضویت شما ارسال شد')
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'خطا در ارسال درخواست')
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
          <p className="text-red-600 text-center">کامیونیتی یافت نشد</p>
          <div className="mt-4 text-center">
            <Link href="/communities">
              <Button variant="ghost">بازگشت به لیست کامیونیتی‌ها</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const isManager = community.my_role === 'manager'
  const isMember = community.my_role !== null

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/communities"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          بازگشت به لیست کامیونیتی‌ها
        </Link>

        {/* Header */}
        <Card variant="elevated" className="p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-20 h-20 rounded-2xl bg-sand-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-10 h-10 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-extrabold text-neutral-900">{community.name}</h1>
                  {isMember && (
                    <Badge variant="success" size="md">
                      {community.my_role === 'manager' ? 'مدیر' : 'عضو'}
                    </Badge>
                  )}
                </div>
                <p className="text-neutral-600 font-light mb-3">{community.description}</p>
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    {community.member_count} عضو
                  </span>
                  <span className="font-light">
                    ایجاد شده توسط {community.creator.first_name} {community.creator.last_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isManager && (
                <Link href={`/communities/${community.id}/manage`}>
                  <Button variant="secondary">
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    مدیریت
                  </Button>
                </Link>
              )}
              {!isMember && (
                <Button onClick={handleJoin} isLoading={joinMutation.isPending}>
                  درخواست عضویت
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'about', label: 'درباره' },
            { id: 'members', label: 'اعضا', count: membersData?.total },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        >
          {/* About Tab */}
          {activeTab === 'about' && (
            <Card variant="bordered" className="p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-3">درباره کامیونیتی</h3>
              <p className="text-neutral-700 font-light leading-relaxed mb-6">
                {community.description || 'توضیحاتی برای این کامیونیتی ثبت نشده است.'}
              </p>

              <div className="pt-6 border-t border-neutral-200">
                <h4 className="text-sm font-medium text-neutral-600 mb-3">اطلاعات تکمیلی</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-neutral-600">تاریخ ایجاد:</span>
                    <p className="font-medium text-neutral-900">
                      {new Date(community.created_at).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-600">آخرین به‌روزرسانی:</span>
                    <p className="font-medium text-neutral-900">
                      {new Date(community.updated_at).toLocaleDateString('fa-IR')}
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
                      <Badge variant={member.role === 'manager' ? 'success' : 'neutral'}>
                        {member.role === 'manager' ? 'مدیر' : member.role === 'moderator' ? 'ناظر' : 'عضو'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="عضوی یافت نشد"
                  description="این کامیونیتی هنوز عضوی ندارد."
                />
              )}
            </Card>
          )}
        </Tabs>
      </div>
    </div>
  )
}

