'use client'

import Link from 'next/link'
import { useState } from 'react'
import Button from '@/components/Button'
import Logo from '@/components/Logo'
import { useTranslation } from '@/hooks/useTranslation'

/**
 * HeroSection - بخش اصلی صفحه لندینگ با رویکرد کاربرمحور
 */
export default function HeroSection() {
  const { t } = useTranslation()
  const [hoveredCard, setHoveredCard] = useState<'traveler' | 'sender' | null>(null)

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-sand-50">
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300A8E8' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating elements - hidden on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
        {/* Airplane icon */}
        <div className="absolute top-[15%] ltr:right-[8%] rtl:left-[8%] animate-float">
          <div className="w-16 h-16 bg-primary-100/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-soft transform rotate-12">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
        </div>

        {/* Package icon */}
        <div className="absolute bottom-[25%] ltr:left-[6%] rtl:right-[6%] animate-float-delayed">
          <div className="w-14 h-14 bg-sand-100/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-soft transform -rotate-6">
            <svg className="w-7 h-7 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>

        {/* Globe icon */}
        <div className="absolute top-[40%] ltr:right-[15%] rtl:left-[15%] animate-float-slow">
          <div className="w-10 h-10 bg-primary-50/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-soft">
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="text-center mb-8 sm:mb-10">
          <Logo variant="full" size="xl" className="mx-auto mb-3" href="/" />
        </div>

        {/* Main Question */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-neutral-900 text-center mb-10 sm:mb-14">
          {t('landing.hero.mainQuestion')}
        </h1>

        {/* Persona Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12">
          {/* Traveler Card */}
          <Link href="/auth/signup?type=traveler">
            <div 
              className={`relative p-6 sm:p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer group ${
                hoveredCard === 'traveler' 
                  ? 'border-primary-500 bg-white shadow-medium scale-[1.02]' 
                  : 'border-primary-200 bg-white/80 hover:border-primary-400 hover:shadow-soft'
              }`}
              onMouseEnter={() => setHoveredCard('traveler')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
                {t('landing.hero.traveler.title')}
              </h2>
              <p className="text-base sm:text-lg text-neutral-600 font-medium mb-4">
                {t('landing.hero.traveler.subtitle')}
              </p>

              {/* Pain Point */}
              <div className="flex items-start gap-2 mb-3 text-sm text-neutral-500">
                <svg className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('landing.hero.traveler.pain')}</span>
              </div>

              {/* Solution */}
              <div className="flex items-start gap-2 mb-6 text-sm text-primary-700 bg-primary-50 rounded-xl p-3">
                <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{t('landing.hero.traveler.solution')}</span>
              </div>

              {/* CTA */}
              <Button variant="primary" size="lg" className="w-full group-hover:shadow-lg transition-shadow">
                {t('landing.hero.traveler.cta')}
              </Button>
            </div>
          </Link>

          {/* Sender Card */}
          <Link href="/auth/signup?type=sender">
            <div 
              className={`relative p-6 sm:p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer group ${
                hoveredCard === 'sender' 
                  ? 'border-sand-500 bg-white shadow-medium scale-[1.02]' 
                  : 'border-sand-200 bg-white/80 hover:border-sand-400 hover:shadow-soft'
              }`}
              onMouseEnter={() => setHoveredCard('sender')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-sand-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
                {t('landing.hero.sender.title')}
              </h2>
              <p className="text-base sm:text-lg text-neutral-600 font-medium mb-4">
                {t('landing.hero.sender.subtitle')}
              </p>

              {/* Pain Point */}
              <div className="flex items-start gap-2 mb-3 text-sm text-neutral-500">
                <svg className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('landing.hero.sender.pain')}</span>
              </div>

              {/* Solution */}
              <div className="flex items-start gap-2 mb-6 text-sm text-sand-700 bg-sand-50 rounded-xl p-3">
                <svg className="w-5 h-5 text-sand-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{t('landing.hero.sender.solution')}</span>
              </div>

              {/* CTA */}
              <Button variant="secondary" size="lg" className="w-full group-hover:shadow-lg transition-shadow bg-sand-500 hover:bg-sand-600 text-white border-sand-500">
                {t('landing.hero.sender.cta')}
              </Button>
            </div>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center">
          <a href="#concepts" className="flex flex-col items-center text-neutral-400 hover:text-primary-600 transition-colors animate-bounce">
            <span className="text-sm font-medium mb-2">{t('landing.concepts.title')}</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-20px) rotate(12deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(-15px) rotate(-6deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
          animation-delay: 2s;
        }
      `}</style>
    </section>
  )
}
