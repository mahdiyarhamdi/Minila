'use client'

import { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { ToastProvider } from './Toast'
import { AuthProvider } from '@/contexts/AuthContext'

interface ProvidersProps {
  children: ReactNode
}

/**
 * Providers - کامپوننت wrapper برای provider‌ها
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

