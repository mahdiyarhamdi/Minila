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
    <div style={shouldAddPadding ? { paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 20px) + 10px)' } : undefined}>
      {children}
    </div>
  )
}

