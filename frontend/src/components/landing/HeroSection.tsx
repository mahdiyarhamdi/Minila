'use client'

import Link from 'next/link'
import Button from '@/components/Button'
import Logo from '@/components/Logo'
import { useTranslation } from '@/hooks/useTranslation'

/**
 * HeroSection - بخش اصلی صفحه لندینگ
 */
export default function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-sand-50">
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300A8E8' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating elements - hidden on mobile to prevent overlap */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        {/* Airplane icon - floating */}
        <div className="absolute top-1/4 ltr:right-[10%] rtl:left-[10%] animate-float">
          <div className="w-20 h-20 lg:w-24 lg:h-24 bg-primary-100 rounded-2xl flex items-center justify-center shadow-soft transform rotate-12">
            <svg className="w-10 h-10 lg:w-12 lg:h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
        </div>

        {/* Package icon - floating delayed */}
        <div className="absolute bottom-1/3 ltr:left-[8%] rtl:right-[8%] animate-float-delayed">
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-sand-100 rounded-2xl flex items-center justify-center shadow-soft transform -rotate-6">
            <svg className="w-8 h-8 lg:w-10 lg:h-10 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>

        {/* Globe icon - floating */}
        <div className="absolute top-1/2 ltr:right-[20%] rtl:left-[20%] animate-float-slow hidden lg:block">
          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center shadow-soft">
            <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
        </div>

        {/* Users icon - floating delayed */}
        <div className="absolute bottom-1/4 ltr:left-[15%] rtl:right-[15%] animate-float-delayed hidden lg:block">
          <div className="w-10 h-10 bg-sand-50 rounded-full flex items-center justify-center shadow-soft">
            <svg className="w-5 h-5 text-sand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
        {/* Logo */}
        <div className="mb-8 sm:mb-10">
          <Logo variant="full" size="xl" className="mx-auto" />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-neutral-900 mb-6 sm:mb-8 leading-relaxed sm:leading-relaxed md:leading-relaxed">
          {t('landing.hero.title')}
          <br className="hidden sm:block" />
          <span className="text-primary-600 relative inline-block mt-2">
            {t('landing.hero.titleHighlight')}
            <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-2 sm:h-3 text-primary-200" viewBox="0 0 100 12" preserveAspectRatio="none">
              <path d="M0 8 Q25 0 50 8 T100 8" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-neutral-600 font-light mb-8 sm:mb-12 max-w-2xl mx-auto leading-loose">
          {t('landing.hero.subtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-12">
          <Link href="/auth/signup">
            <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
              {t('landing.hero.cta')}
              <svg className="w-5 h-5 ltr:ml-2 rtl:mr-2 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
          <Link href="/cards">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
              {t('landing.hero.secondaryCta')}
            </Button>
          </Link>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-200 to-sand-200 border-2 border-white flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            ))}
          </div>
          <span className="font-medium">{t('landing.hero.trustedBy')}</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <a href="#features" className="flex flex-col items-center text-neutral-400 hover:text-primary-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
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

