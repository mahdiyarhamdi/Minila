import { useState, useEffect } from 'react'
import { apiService } from '@/lib/api'
import type { User } from '@/types/auth'

/**
 * Hook برای مدیریت authentication
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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

  const logout = () => {
    apiService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    refetchUser: checkAuth,
  }
}

