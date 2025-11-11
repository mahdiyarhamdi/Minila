'use client'

import Link from 'next/link'
import { useMyCommunities } from '@/hooks/useCommunities'
import CommunityCard from '@/components/communities/CommunityCard'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@/components/Button'
import Card from '@/components/Card'

/**
 * صفحه کامیونیتی‌های من
 */
export default function MyCommunitiesPage() {
  const { data, isLoading, error } = useMyCommunities()

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">
              کامیونیتی‌های من
            </h1>
            <p className="text-neutral-600 font-light">
              کامیونیتی‌هایی که در آن‌ها عضو هستید
            </p>
          </div>

          <Link href="/communities/new">
            <Button size="lg">
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              ایجاد کامیونیتی جدید
            </Button>
          </Link>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <Card variant="bordered" className="p-6">
            <p className="text-red-600 text-center">خطا در دریافت کامیونیتی‌ها</p>
          </Card>
        )}

        {data && data.items.length === 0 && (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            title="عضو هیچ کامیونیتی نیستید"
            description="هنوز در هیچ کامیونیتی عضو نشده‌اید. به کامیونیتی‌ها بپیوندید یا خودتان یکی بسازید."
            action={
              <div className="flex gap-3">
                <Link href="/communities">
                  <Button variant="secondary">مشاهده کامیونیتی‌ها</Button>
                </Link>
                <Link href="/communities/new">
                  <Button>ایجاد کامیونیتی</Button>
                </Link>
              </div>
            }
          />
        )}

        {data && data.items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((community) => (
              <div key={community.id} className="relative">
                <CommunityCard {...community} is_member={true} />
                
                {/* Manager Badge */}
                {community.my_role === 'manager' && (
                  <Link
                    href={`/communities/${community.id}/manage`}
                    className="absolute top-4 left-4 px-3 py-1.5 bg-white rounded-lg shadow-medium hover:shadow-strong transition-shadow flex items-center gap-2 text-sm font-medium text-primary-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

