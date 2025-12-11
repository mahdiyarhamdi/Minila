'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { useCommunities } from '@/hooks/useCommunities'
import Card from '@/components/Card'
import Button from '@/components/Button'
import LoadingSpinner from '@/components/LoadingSpinner'

/**
 * CommunitiesCarousel - کاروسل کامیونیتی‌ها
 */
export default function CommunitiesCarousel() {
  const { t, formatNumber } = useTranslation()
  const { data, isLoading } = useCommunities(1, 8)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const communities = data?.items || []

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
  }, [communities])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section id="communities" className="py-16 sm:py-24 bg-gradient-to-br from-sand-50 to-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
              {t('landing.communities.title')}
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 font-light">
              {t('landing.communities.subtitle')}
            </p>
          </div>
          <Link href="/communities">
            <Button variant="secondary" size="md">
              {t('landing.communities.viewAll')}
              <svg className="w-4 h-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation buttons */}
          {communities.length > 0 && (
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

          {/* Communities container */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sand-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-sand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-neutral-600 font-light">{t('landing.communities.noCommunities')}</p>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {communities.map((community) => (
                <Link
                  key={community.id}
                  href={`/communities/${community.id}`}
                  className="flex-shrink-0 w-64 sm:w-72"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <Card variant="bordered" className="p-5 h-full hover:shadow-medium transition-shadow bg-white">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-full bg-sand-100 flex items-center justify-center mb-4">
                      <svg className="w-7 h-7 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>

                    {/* Name */}
                    <h3 className="text-base font-bold text-neutral-900 mb-1">
                      {community.name}
                    </h3>

                    {/* Slug */}
                    <code className="text-xs font-mono text-neutral-500 mb-3 block" dir="ltr">
                      @{community.slug}
                    </code>

                    {/* Bio */}
                    {community.bio && (
                      <p className="text-sm text-neutral-600 font-light line-clamp-2 mb-4">
                        {community.bio}
                      </p>
                    )}

                    {/* Member count */}
                    <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-sm text-neutral-600">
                        {formatNumber(community.member_count || 0)} {t('landing.communities.members')}
                      </span>
                    </div>
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

