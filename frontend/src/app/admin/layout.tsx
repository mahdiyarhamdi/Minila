'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { apiService } from '@/lib/api'

// آیکون‌ها
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const CommunitiesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const CardsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

const ReportsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const LogsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const BackupIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
)

const AlertsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const menuItems = [
  { href: '/admin', label: 'داشبورد', icon: DashboardIcon, exact: true },
  { href: '/admin/alerts', label: 'هشدارها', icon: AlertsIcon, badge: true },
  { href: '/admin/users', label: 'کاربران', icon: UsersIcon },
  { href: '/admin/communities', label: 'کامیونیتی‌ها', icon: CommunitiesIcon },
  { href: '/admin/cards', label: 'کارت‌ها', icon: CardsIcon },
  { href: '/admin/reports', label: 'گزارش‌ها', icon: ReportsIcon },
  { href: '/admin/logs', label: 'لاگ‌ها', icon: LogsIcon },
  { href: '/admin/backups', label: 'پشتیبان‌گیری', icon: BackupIcon },
  { href: '/admin/settings', label: 'تنظیمات', icon: SettingsIcon },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadAlerts, setUnreadAlerts] = useState(0)

  // بارگذاری تعداد هشدارهای خوانده نشده
  const loadUnreadAlerts = useCallback(async () => {
    try {
      const data = await apiService.getAdminUnreadAlertsCount()
      setUnreadAlerts(data.unread_count)
    } catch (err) {
      console.error('Failed to load unread alerts count:', err)
    }
  }, [])

  // بررسی دسترسی ادمین
  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  // بارگذاری هشدارها
  useEffect(() => {
    if (user?.is_admin) {
      loadUnreadAlerts()
      // بروزرسانی هر 60 ثانیه
      const interval = setInterval(loadUnreadAlerts, 60000)
      return () => clearInterval(interval)
    }
  }, [user, loadUnreadAlerts])

  // نمایش لودینگ - برای SSR و هنگام بارگذاری
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  // اگر کاربر ادمین نیست - ریدایرکت در useEffect انجام می‌شود
  if (!user.is_admin) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">شما دسترسی به این بخش را ندارید</p>
          <a href="/dashboard" className="text-primary-600 hover:underline">بازگشت به داشبورد</a>
        </div>
      </div>
    )
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-neutral-100" dir="rtl">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 h-full w-64 bg-neutral-900 text-white z-50 transform transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold">M</span>
            </div>
            <span className="font-bold">پنل مدیریت</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-neutral-800 rounded"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            const showBadge = item.badge && unreadAlerts > 0
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative",
                  active
                    ? "bg-primary-600 text-white"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                )}
              >
                <Icon />
                <span className="font-medium">{item.label}</span>
                {showBadge && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadAlerts > 99 ? '99+' : unreadAlerts}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Back to app */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-700">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <BackIcon />
            <span className="font-medium">بازگشت به اپ</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:mr-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-neutral-200 sticky top-0 z-30">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Mobile menu button */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg"
            >
              <MenuIcon />
            </button>

            {/* Page title - will be overridden by pages */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg font-bold text-neutral-900 hidden lg:block">
                پنل مدیریت Minila
              </h1>
            </div>

            {/* Admin info */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-600 hidden sm:block">
                {user.first_name} {user.last_name}
              </span>
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">
                  {user.first_name?.[0] || user.email[0].toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

