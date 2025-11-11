'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import Button from './Button'

/**
 * Navbar - نوار ناوبری اصلی
 */
export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  // صفحات احراز هویت Navbar ندارند
  if (pathname?.startsWith('/auth')) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const navLinks = [
    { href: '/dashboard', label: 'داشبورد' },
    { href: '/cards', label: 'کارت‌ها' },
    { href: '/communities', label: 'کامیونیتی‌ها' },
    { href: '/messages', label: 'پیام‌ها', badge: 0 },
  ]

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-neutral-900">Minila</h1>
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
                  <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          {user && (
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-neutral-600 font-medium">
                {user.first_name} {user.last_name}
              </span>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                {profileMenuOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-strong border border-neutral-200 py-2">
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      ویرایش پروفایل
                    </Link>
                    <Link
                      href="/dashboard/my-cards"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      کارت‌های من
                    </Link>
                    <Link
                      href="/dashboard/my-communities"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      کامیونیتی‌های من
                    </Link>
                    <Link
                      href="/dashboard/blocked-users"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      بلاک لیست
                    </Link>
                    <div className="border-t border-neutral-200 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      خروج
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              
              {user && (
                <>
                  <div className="border-t border-neutral-200 my-2"></div>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    ویرایش پروفایل
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-right px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    خروج
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

