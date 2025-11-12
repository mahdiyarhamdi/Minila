'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiService } from '@/lib/api'
import type { User } from '@/types/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (token: string, refreshToken: string) => Promise<void>
  logout: () => void
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider - مدیریت مرکزی authentication در سطح app
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // چک کردن authentication هنگام mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const userData = await apiService.getProfile()
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      // Token منقضی شده یا نامعتبر است
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (token: string, refreshToken: string) => {
    // ذخیره token ها
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', refreshToken)
    
    // دریافت اطلاعات کاربر
    try {
      const userData = await apiService.getProfile()
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      // در صورت خطا، token ها را پاک کن
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      throw error
    }
  }

  const logout = () => {
    apiService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  const refetchUser = async () => {
    await checkAuth()
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refetchUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook برای دسترسی به AuthContext
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

