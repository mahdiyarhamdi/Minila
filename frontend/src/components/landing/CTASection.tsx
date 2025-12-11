'use client'

import Link from 'next/link'
import Button from '@/components/Button'
import { useTranslation } from '@/hooks/useTranslation'

/**
 * CTASection - بخش دعوت به اقدام
 */
export default function CTASection() {
  const { t } = useTranslation()

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-sand-100 via-primary-50 to-sand-50 p-8 sm:p-12 md:p-16 text-center overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-64 h-64 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 ltr:translate-x-1/2 rtl:-translate-x-1/2" />
          <div className="absolute bottom-0 ltr:left-0 rtl:right-0 w-48 h-48 bg-sand-300/30 rounded-full blur-3xl translate-y-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2" />

          {/* Content */}
          <div className="relative z-10">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white shadow-soft flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {t('landing.cta.title')}
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-neutral-600 font-light mb-8 max-w-xl mx-auto">
              {t('landing.cta.subtitle')}
            </p>

            {/* Button */}
            <Link href="/auth/signup">
              <Button variant="primary" size="lg" className="px-10">
                {t('landing.cta.button')}
                <svg className="w-5 h-5 ltr:ml-2 rtl:mr-2 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

