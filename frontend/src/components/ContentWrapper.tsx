'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * ContentWrapper - اضافه کردن padding پایین برای جا دادن bottom nav در موبایل
 * فقط وقتی کاربر لاگین باشد و در صفحه auth نباشد
 */
export default function ContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  
  // Don't add padding on auth pages or when not authenticated
  const isAuthPage = pathname?.startsWith('/auth')
  const shouldAddPadding = isAuthenticated && !isAuthPage
  
  return (
    <div className={shouldAddPadding ? 'pb-16 md:pb-0' : ''}>
      {children}
    </div>
  )
}

