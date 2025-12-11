'use client'

import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Logo from '@/components/Logo'
import LanguageSelector from '@/components/LanguageSelector'
import { useTranslation } from '@/hooks/useTranslation'

export default function TermsPage() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen px-4 py-6 sm:p-4 bg-gradient-to-br from-neutral-50 via-sand-50 to-primary-50 relative">
      {/* Language Selector */}
      <div className="absolute top-4 ltr:right-4 rtl:left-4 z-10">
        <LanguageSelector />
      </div>

      {/* Back Button */}
      <div className="absolute top-4 ltr:left-4 rtl:right-4 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 hover:bg-white text-neutral-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">{t('common.back')}</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto pt-16">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <Logo variant="full" size="md" className="mx-auto mb-2" />
        </div>

        {/* Main Card */}
        <Card variant="elevated" className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-6 text-center">
            {t('legal.terms.title')}
          </h1>

          <div className="prose prose-neutral max-w-none space-y-6 text-neutral-700">
            {/* Introduction */}
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">
                {t('legal.terms.sections.introduction.title')}
              </h2>
              <p className="text-sm leading-relaxed font-light">
                {t('legal.terms.sections.introduction.content')}
              </p>
            </section>

            {/* Service Definition */}
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">
                {t('legal.terms.sections.serviceDefinition.title')}
              </h2>
              <p className="text-sm leading-relaxed font-light">
                {t('legal.terms.sections.serviceDefinition.content')}
              </p>
            </section>

            {/* Account Terms */}
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">
                {t('legal.terms.sections.accountTerms.title')}
              </h2>
              <p className="text-sm leading-relaxed font-light">
                {t('legal.terms.sections.accountTerms.content')}
              </p>
            </section>

            {/* Card Rules */}
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">
                {t('legal.terms.sections.cardRules.title')}
              </h2>
              <p className="text-sm leading-relaxed font-light">
                {t('legal.terms.sections.cardRules.content')}
              </p>
            </section>

            {/* Messaging Rules */}
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">
                {t('legal.terms.sections.messagingRules.title')}
              </h2>
              <p className="text-sm leading-relaxed font-light">
                {t('legal.terms.sections.messagingRules.content')}
              </p>
            </section>

            {/* Privacy */}
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">
                {t('legal.terms.sections.privacy.title')}
              </h2>
              <p className="text-sm leading-relaxed font-light">
                {t('legal.terms.sections.privacy.content')}
              </p>
            </section>

            {/* Restrictions */}
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">
                {t('legal.terms.sections.restrictions.title')}
              </h2>
              <p className="text-sm leading-relaxed font-light">
                {t('legal.terms.sections.restrictions.content')}
              </p>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">
                {t('legal.terms.sections.disclaimer.title')}
              </h2>
              <p className="text-sm leading-relaxed font-light">
                {t('legal.terms.sections.disclaimer.content')}
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">
                {t('legal.terms.sections.changes.title')}
              </h2>
              <p className="text-sm leading-relaxed font-light">
                {t('legal.terms.sections.changes.content')}
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">
                {t('legal.terms.sections.contact.title')}
              </h2>
              <p className="text-sm leading-relaxed font-light">
                {t('legal.terms.sections.contact.content')}
              </p>
            </section>
          </div>

          {/* Last Updated */}
          <div className="mt-8 pt-6 border-t border-neutral-200 text-center">
            <p className="text-xs text-neutral-500">
              {t('legal.terms.lastUpdated')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

