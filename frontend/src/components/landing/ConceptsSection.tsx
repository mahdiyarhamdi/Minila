'use client'

import { useTranslation } from '@/hooks/useTranslation'
import Card from '@/components/Card'

/**
 * ConceptsSection - توضیح مفاهیم کلیدی: کامیونیتی، کارت، اعتماد
 */
export default function ConceptsSection() {
  const { t } = useTranslation()

  return (
    <section id="concepts" className="py-16 sm:py-24 bg-gradient-to-b from-white to-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            {t('landing.concepts.title')}
          </h2>
        </div>

        {/* Concepts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Community Concept */}
          <Card variant="bordered" className="p-6 sm:p-8 hover:shadow-medium transition-all duration-300 group relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 ltr:right-0 rtl:left-0 w-32 h-32 bg-primary-50 rounded-full -translate-y-1/2 ltr:translate-x-1/2 rtl:-translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative">
              {/* Icon */}
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-3">
                {t('landing.concepts.community.title')}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base text-neutral-600 font-light leading-relaxed mb-4">
                {t('landing.concepts.community.description')}
              </p>

              {/* Example */}
              <div className="bg-primary-50 rounded-xl p-3 text-sm text-primary-700">
                <span className="font-medium">💡 </span>
                {t('landing.concepts.community.example')}
              </div>

              {/* Visual: People around central person */}
              <div className="mt-6 flex justify-center">
                <div className="relative">
                  {/* Central person */}
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg z-10 relative">
                    👤
                  </div>
                  {/* Surrounding people */}
                  <div className="absolute -top-3 -left-6 w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center text-sm">👤</div>
                  <div className="absolute -top-3 -right-6 w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center text-sm">👤</div>
                  <div className="absolute -bottom-3 -left-6 w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center text-sm">👤</div>
                  <div className="absolute -bottom-3 -right-6 w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center text-sm">👤</div>
                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full" style={{ transform: 'scale(2.5)' }}>
                    <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="#00A8E8" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                    <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="#00A8E8" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                    <line x1="50%" y1="50%" x2="20%" y2="80%" stroke="#00A8E8" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                    <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="#00A8E8" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          {/* Card Concept */}
          <Card variant="bordered" className="p-6 sm:p-8 hover:shadow-medium transition-all duration-300 group relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 ltr:right-0 rtl:left-0 w-32 h-32 bg-sand-50 rounded-full -translate-y-1/2 ltr:translate-x-1/2 rtl:-translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative">
              {/* Icon */}
              <div className="w-14 h-14 bg-sand-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-3">
                {t('landing.concepts.card.title')}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base text-neutral-600 font-light leading-relaxed mb-4">
                {t('landing.concepts.card.description')}
              </p>

              {/* Visual: Card mockup */}
              <div className="mt-4 bg-gradient-to-br from-sand-50 to-sand-100 rounded-xl p-4 border border-sand-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-sand-200 rounded-full flex items-center justify-center text-sm">✈️</div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">Tehran → Dubai</div>
                    <div className="text-xs text-neutral-500">Jan 15, 2025</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4" />
                    </svg>
                    5 kg
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
                    </svg>
                    $5/kg
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Trust Concept */}
          <Card variant="bordered" className="p-6 sm:p-8 hover:shadow-medium transition-all duration-300 group relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 ltr:right-0 rtl:left-0 w-32 h-32 bg-green-50 rounded-full -translate-y-1/2 ltr:translate-x-1/2 rtl:-translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative">
              {/* Icon */}
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-3">
                {t('landing.concepts.trust.title')}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base text-neutral-600 font-light leading-relaxed mb-4">
                {t('landing.concepts.trust.description')}
              </p>

              {/* Visual: Connection diagram */}
              <div className="mt-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  {/* Person A */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-lg mb-1">👤</div>
                    <span className="text-xs text-neutral-600">You</span>
                  </div>
                  
                  {/* Connection */}
                  <div className="flex-1 px-2">
                    <div className="relative">
                      <div className="h-0.5 bg-green-300 w-full"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm shadow-sm">
                        🤝
                      </div>
                    </div>
                    <div className="text-center mt-2 text-xs text-green-700 font-medium">Shared Community</div>
                  </div>
                  
                  {/* Person B */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-lg mb-1">👤</div>
                    <span className="text-xs text-neutral-600">Traveler</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

