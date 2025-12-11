'use client'

import { useTranslation } from '@/hooks/useTranslation'

const steps = [
  {
    key: 'step1',
    number: '01',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: 'step2',
    number: '02',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'step3',
    number: '03',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
]

/**
 * HowItWorks - بخش نحوه کار پلتفرم
 */
export default function HowItWorks() {
  const { t } = useTranslation()

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-gradient-to-br from-neutral-50 to-sand-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-light max-w-2xl mx-auto">
            {t('landing.howItWorks.subtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line - hidden on mobile */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-sand-300 to-primary-200 transform -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 relative z-10">
            {steps.map((step, index) => (
              <div key={step.key} className="relative">
                {/* Card */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-medium transition-shadow text-center">
                  {/* Step number */}
                  <div className="absolute -top-4 ltr:left-6 rtl:right-6 sm:ltr:left-8 sm:rtl:right-8">
                    <span className="inline-block px-3 py-1 bg-primary-600 text-white text-sm font-bold rounded-full">
                      {step.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto mb-6 mt-2 rounded-2xl bg-gradient-to-br from-primary-100 to-sand-100 flex items-center justify-center text-primary-600">
                    {step.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-neutral-900 mb-3">
                    {t(`landing.howItWorks.${step.key}.title`)}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-neutral-600 font-light leading-relaxed">
                    {t(`landing.howItWorks.${step.key}.description`)}
                  </p>
                </div>

                {/* Arrow connector for mobile */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-4 lg:hidden">
                    <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

