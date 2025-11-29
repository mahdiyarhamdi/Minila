'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCommunities } from '@/hooks/useCommunities'
import CommunityCard from '@/components/communities/CommunityCard'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'

/**
 * صفحه لیست کامیونیتی‌ها
 */
export default function CommunitiesPage() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, error } = useCommunities(page, 20)

  // فیلتر بر اساس جست‌وجو
  const filteredCommunities = data?.items.filter((community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
              کامیونیتی‌ها
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 font-light">
              به کامیونیتی‌های مختلف بپیوندید یا کامیونیتی جدید بسازید
            </p>
          </div>

          <Link href="/communities/new" className="w-full sm:w-auto self-start">
            <Button size="lg" className="w-full sm:w-auto">
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              ایجاد کامیونیتی
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            type="search"
            placeholder="جست‌وجو در کامیونیتی‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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

        {filteredCommunities && filteredCommunities.length === 0 && (
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
            title="کامیونیتی یافت نشد"
            description={
              searchQuery
                ? 'کامیونیتی با این نام پیدا نشد. جست‌وجو را تغییر دهید.'
                : 'هنوز کامیونیتی ایجاد نشده است. اولین کامیونیتی را بسازید.'
            }
            action={
              <Link href="/communities/new">
                <Button>ایجاد اولین کامیونیتی</Button>
              </Link>
            }
          />
        )}

        {filteredCommunities && filteredCommunities.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {filteredCommunities.map((community) => (
                <CommunityCard key={community.id} {...community} />
              ))}
            </div>

            {/* Pagination Info */}
            {data && (
              <Card variant="bordered" className="p-4">
                <div className="flex justify-between items-center text-sm text-neutral-600">
                  <span>
                    نمایش {filteredCommunities.length} از {data.total} کامیونیتی
                  </span>
                  <span>صفحه {data.page}</span>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

