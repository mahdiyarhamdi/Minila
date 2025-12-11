'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCards } from '@/hooks/useCards'
import { useTranslation } from '@/hooks/useTranslation'
import Card from '@/components/Card'
import CardItem from '@/components/cards/CardItem'
import FilterPanel from '@/components/cards/FilterPanel'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@/components/Button'
import type { CardFilter } from '@/types/card'

/**
 * Cards listing page with mobile-friendly filters
 */
export default function CardsPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<CardFilter>({})
  const { data, isLoading, error } = useCards(filters)

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
              {t('cards.title')}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 font-light">
              {t('cards.subtitle')}
            </p>
          </div>

          <Link href="/cards/new" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              <svg
                className="w-5 h-5 ltr:mr-2 rtl:ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t('cards.createButton')}
            </Button>
          </Link>
        </div>

        {/* Mobile Filter Panel */}
        <div className="lg:hidden mb-6">
          <FilterPanel onFilterChange={setFilters} initialFilters={filters} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel - Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <FilterPanel onFilterChange={setFilters} initialFilters={filters} />
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
                <p className="text-red-600 text-center">{t('cards.error')}</p>
              </Card>
            )}

            {data && data.items.length === 0 && (
              <EmptyState
                icon={
                  <svg
                    className="w-16 h-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                }
                title={t('cards.noCards')}
                description={t('cards.noCardsDescription')}
                action={
                  <Link href="/cards/new">
                    <Button>{t('cards.createFirst')}</Button>
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
                    <span>
                      {t('cards.pagination.showing', {
                        count: data.items.length.toString(),
                        total: data.total.toString(),
                      })}
                    </span>
                    <span>{t('cards.pagination.page', { page: data.page.toString() })}</span>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
