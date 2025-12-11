'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useUnreadCount } from '@/hooks/useMessages'
import Button from './Button'
import LanguageSelector from './LanguageSelector'
import Logo from './Logo'

/**
 * Navbar - نوار ناوبری اصلی
 */
export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const { data: unreadCount, refetch } = useUnreadCount(!!user)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  // Close menus when user state changes (login/logout)
  useEffect(() => {
    setProfileMenuOpen(false)
    setMobileMenuOpen(false)
  }, [user])

  // Refetch unread count when user logs in
  useEffect(() => {
    if (user) {
      refetch()
    }
  }, [user, refetch])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (profileMenuOpen && !target.closest('[data-profile-menu]')) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen])

  // Auth pages and landing page don't show Navbar
  if (pathname?.startsWith('/auth') || pathname === '/') {
    return null
  }

  const handleLogout = () => {
    setProfileMenuOpen(false)
    setMobileMenuOpen(false)
    logout()
    router.push('/auth/login')
  }

  const navLinks = [
    { href: '/dashboard', label: t('nav.dashboard') },
    { href: '/cards', label: t('nav.cards') },
    { href: '/communities', label: t('nav.communities') },
    { href: '/messages', label: t('nav.messages'), badge: unreadCount || 0 },
  ]

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="icon" size="sm" />
            <span className="text-xl font-black text-neutral-900">Minila</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-neutral-700 hover:bg-neutral-100'
                )}
              >
                {link.label}
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="absolute -top-1 ltr:-right-1 rtl:-left-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-bold shadow-sm">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center gap-2">
            {/* Language Selector */}
            <LanguageSelector variant="desktop" />
            
            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-600 font-medium">
                  {user.first_name} {user.last_name}
                </span>
                
                {/* Profile Dropdown */}
                <div className="relative" data-profile-menu>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-48 bg-white rounded-xl shadow-strong border border-neutral-200 py-2">
                      <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        {t('profile.title')}
                      </Link>
                      <Link
                        href="/dashboard/my-cards"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        {t('profile.myCards')}
                      </Link>
                      <Link
                        href="/dashboard/my-communities"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        {t('profile.myCommunities')}
                      </Link>
                      <Link
                        href="/dashboard/blocked-users"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        {t('profile.blockedUsers')}
                      </Link>
                      <div className="border-t border-neutral-200 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full ltr:text-left rtl:text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
          >
            <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu - Only profile/settings, navigation is in bottom nav */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="flex flex-col gap-1">
              {/* User Info on Mobile */}
              {user && (
                <div className="px-4 py-3 mb-2 bg-neutral-50 rounded-lg">
                  <p className="text-sm font-medium text-neutral-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-neutral-600 font-light" dir="ltr">
                    {user.email}
                  </p>
                </div>
              )}
              
              {/* Language Selector (Mobile) */}
              <LanguageSelector variant="mobile" />
              
              {user && (
                <>
                  <div className="border-t border-neutral-200 my-2"></div>
                  <p className="px-4 py-1 text-xs text-neutral-500 font-medium">
                    {t('nav.profile')}
                  </p>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    {t('profile.title')}
                  </Link>
                  <Link
                    href="/dashboard/my-cards"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    {t('profile.myCards')}
                  </Link>
                  <Link
                    href="/dashboard/my-communities"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    {t('profile.myCommunities')}
                  </Link>
                  <Link
                    href="/dashboard/blocked-users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    {t('profile.blockedUsers')}
                  </Link>
                  <div className="border-t border-neutral-200 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="ltr:text-left rtl:text-right px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
