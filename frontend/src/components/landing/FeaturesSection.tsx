'use client'

import { useTranslation } from '@/hooks/useTranslation'
import Card from '@/components/Card'

const features = [
  {
    key: 'coordination',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'primary',
  },
  {
    key: 'communities',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'sand',
  },
  {
    key: 'messaging',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'primary',
  },
  {
    key: 'search',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
    color: 'sand',
  },
]

/**
 * FeaturesSection - بخش ویژگی‌های پلتفرم
 */
export default function FeaturesSection() {
  const { t } = useTranslation()

  return (
    <section id="features" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            {t('landing.features.title')}
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-light max-w-2xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature) => (
            <Card
              key={feature.key}
              variant="bordered"
              className="p-6 sm:p-8 text-center hover:shadow-medium transition-all duration-300 group"
            >
              {/* Icon */}
              <div
                className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                  feature.color === 'primary'
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-sand-100 text-sand-600'
                }`}
              >
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-neutral-900 mb-3">
                {t(`landing.features.${feature.key}.title`)}
              </h3>

              {/* Description */}
              <p className="text-sm text-neutral-600 font-light leading-relaxed">
                {t(`landing.features.${feature.key}.description`)}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

