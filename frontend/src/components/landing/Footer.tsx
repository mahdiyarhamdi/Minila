'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'
import LanguageSelector from '@/components/LanguageSelector'
import { useTranslation } from '@/hooks/useTranslation'

/**
 * Footer - فوتر صفحه لندینگ
 */
export default function Footer() {
  const { t } = useTranslation()

  const quickLinks = [
    { href: '/', label: t('landing.footer.home') },
    { href: '/cards', label: t('nav.cards') },
    { href: '/communities', label: t('nav.communities') },
    { href: '/auth/login', label: t('nav.login') },
    { href: '/auth/signup', label: t('nav.signup') },
  ]

  const legalLinks = [
    { href: '/terms', label: t('landing.footer.terms') },
  ]

  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-10 sm:py-12 lg:py-16">
          {/* Brand section - centered on mobile */}
          <div className="text-center sm:text-start mb-10 sm:mb-12">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
              <Logo variant="icon" size="sm" href="/" />
              <span className="text-xl font-bold text-white">Minila</span>
            </div>
            <p className="text-neutral-400 font-light text-sm leading-relaxed max-w-md mx-auto sm:mx-0 mb-6">
              {t('landing.footer.description')}
            </p>
            
            {/* Language selector */}
            <div className="flex justify-center sm:justify-start">
              <LanguageSelector />
            </div>
          </div>

          {/* Links grid - side by side on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                {t('landing.footer.quickLinks')}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-neutral-400 hover:text-white text-sm font-light transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                {t('landing.footer.legal')}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-neutral-400 hover:text-white text-sm font-light transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-neutral-800 flex justify-center items-center">
          <p className="text-neutral-500 text-sm font-light text-center">
            {t('landing.footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}

