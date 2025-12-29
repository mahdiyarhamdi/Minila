'use client'

import { useTranslation } from '@/hooks/useTranslation'
import Card from '@/components/Card'

/**
 * HowItWorks - بخش نحوه کار پلتفرم (ترکیب شده با مفاهیم کلیدی)
 */
export default function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    {
      key: 'community',
      number: '1',
      color: 'primary',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      key: 'card',
      number: '2',
      color: 'sand',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      key: 'connect',
      number: '3',
      color: 'green',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return {
          bg: 'bg-primary-100',
          text: 'text-primary-600',
          badge: 'bg-primary-700',
          hint: 'bg-primary-50 text-primary-800',
        }
      case 'sand':
        return {
          bg: 'bg-sand-100',
          text: 'text-sand-600',
          badge: 'bg-sand-700',
          hint: 'bg-sand-50 text-sand-800',
        }
      case 'green':
        return {
          bg: 'bg-green-100',
          text: 'text-green-600',
          badge: 'bg-green-700',
          hint: 'bg-green-50 text-green-800',
        }
      default:
        return {
          bg: 'bg-neutral-100',
          text: 'text-neutral-600',
          badge: 'bg-neutral-600',
          hint: 'bg-neutral-50 text-neutral-800',
        }
    }
  }

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
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-sand-300 to-green-200 transform -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 relative z-10">
            {steps.map((step, index) => {
              const colors = getColorClasses(step.color)
              return (
                <div key={step.key} className="relative">
                  {/* Card */}
                  <Card variant="bordered" className="p-6 sm:p-8 hover:shadow-medium transition-all duration-300 group h-full">
                    {/* Step number badge */}
                    <div className="absolute -top-4 ltr:left-6 rtl:right-6 sm:ltr:left-8 sm:rtl:right-8">
                      <span className={`inline-block px-3 py-1 ${colors.badge} text-white text-sm font-bold rounded-full`}>
                        {step.number}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 mx-auto mb-6 mt-2 rounded-2xl ${colors.bg} flex items-center justify-center ${colors.text} group-hover:scale-110 transition-transform`}>
                      {step.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-3 text-center">
                      {t(`landing.howItWorks.${step.key}.title`)}
                    </h3>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-neutral-600 font-light leading-relaxed text-center mb-4">
                      {t(`landing.howItWorks.${step.key}.description`)}
                    </p>

                    {/* Hint/Example */}
                    <div className={`${colors.hint} rounded-xl p-3 text-sm text-center`}>
                      <span className="font-medium">💡 </span>
                      {t(`landing.howItWorks.${step.key}.hint`)}
                    </div>
                  </Card>

                  {/* Arrow connector for mobile */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-4 lg:hidden">
                      <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
