'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCards } from '@/hooks/useCards'
import Card from '@/components/Card'
import CardItem from '@/components/cards/CardItem'
import FilterPanel from '@/components/cards/FilterPanel'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@/components/Button'
import type { CardFilter } from '@/types/card'

/**
 * صفحه لیست کارت‌ها
 */
export default function CardsPage() {
  const [filters, setFilters] = useState<CardFilter>({})
  const { data, isLoading, error } = useCards(filters)

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
              کارت‌های سفر و بار
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 font-light">
              جست‌وجو و مشاهده تمام کارت‌های موجود
            </p>
          </div>
          
          <Link href="/cards/new" className="w-full sm:w-auto self-start">
            <Button size="lg" className="w-full sm:w-auto">
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              ایجاد کارت جدید
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel - Desktop */}
          <div className="hidden lg:block">
            <FilterPanel onFilterChange={setFilters} />
          </div>

          {/* Cards Grid */}
          <div className="lg:col-span-3">
            {isLoading && (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {error && (
              <Card variant="bordered" className="p-6">
                <p className="text-red-600 text-center">خطا در دریافت کارت‌ها</p>
              </Card>
            )}

            {data && data.items.length === 0 && (
              <EmptyState
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                }
                title="کارتی یافت نشد"
                description="هیچ کارتی با فیلترهای انتخابی شما پیدا نشد. فیلترها را تغییر دهید یا کارت جدید ایجاد کنید."
                action={
                  <Link href="/cards/new">
                    <Button>ایجاد اولین کارت</Button>
                  </Link>
                }
              />
            )}

            {data && data.items.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                  {data.items.map((card) => (
                    <CardItem key={card.id} {...card} />
                  ))}
                </div>

                {/* Pagination Info */}
                <Card variant="bordered" className="p-4">
                  <div className="flex justify-between items-center text-sm text-neutral-600">
                    <span>نمایش {data.items.length} از {data.total} کارت</span>
                    <span>صفحه {data.page}</span>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Filter Panel - Mobile (Collapsed) */}
        <div className="lg:hidden mt-6">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <Card variant="bordered" className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900">فیلترها</span>
                  <svg
                    className="w-5 h-5 text-neutral-600 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </Card>
            </summary>
            <div className="mt-4">
              <FilterPanel onFilterChange={setFilters} />
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

