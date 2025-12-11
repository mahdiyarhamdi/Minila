'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { useCards } from '@/hooks/useCards'
import Card from '@/components/Card'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import LoadingSpinner from '@/components/LoadingSpinner'

/**
 * CardsCarousel - کاروسل کارت‌های اخیر
 */
export default function CardsCarousel() {
  const { t, formatDate, formatNumber } = useTranslation()
  const { data, isLoading } = useCards({ page: 1, page_size: 8 })
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const cards = data?.items || []

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const ref = scrollRef.current
    if (ref) {
      ref.addEventListener('scroll', checkScroll)
      return () => ref.removeEventListener('scroll', checkScroll)
    }
  }, [cards])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section id="cards" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
              {t('landing.cards.title')}
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 font-light">
              {t('landing.cards.subtitle')}
            </p>
          </div>
          <Link href="/cards">
            <Button variant="outline" size="md">
              {t('landing.cards.viewAll')}
              <svg className="w-4 h-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation buttons */}
          {cards.length > 0 && (
            <>
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`absolute ltr:-left-4 rtl:-right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-medium flex items-center justify-center transition-opacity ${
                  canScrollLeft ? 'opacity-100 hover:bg-neutral-50' : 'opacity-0 pointer-events-none'
                }`}
              >
                <svg className="w-5 h-5 text-neutral-700 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`absolute ltr:-right-4 rtl:-left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-medium flex items-center justify-center transition-opacity ${
                  canScrollRight ? 'opacity-100 hover:bg-neutral-50' : 'opacity-0 pointer-events-none'
                }`}
              >
                <svg className="w-5 h-5 text-neutral-700 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Cards container */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-neutral-600 font-light">{t('landing.cards.noCards')}</p>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {cards.map((card) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}`}
                  className="flex-shrink-0 w-72 sm:w-80"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <Card variant="bordered" className="p-5 h-full hover:shadow-medium transition-shadow">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-bold text-neutral-900 mb-1">
                          {card.origin_city?.name} → {card.destination_city?.name}
                        </h3>
                        <p className="text-sm text-neutral-500 font-light">
                          {card.owner?.first_name} {card.owner?.last_name}
                        </p>
                      </div>
                      <Badge variant={card.is_sender ? 'warning' : 'info'} size="sm">
                        {card.is_sender ? t('cards.detail.type.sender') : t('cards.detail.type.traveler')}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      {(card.ticket_date_time || card.start_time_frame) && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-neutral-600">
                            {formatDate(card.ticket_date_time || card.start_time_frame || '')}
                          </span>
                        </div>
                      )}
                      {card.weight && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span className="text-neutral-600">{formatNumber(card.weight)} {t('cards.detail.kg')}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {card.description && (
                      <p className="text-sm text-neutral-500 font-light line-clamp-2">
                        {card.description}
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

