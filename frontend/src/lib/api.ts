import axios, { AxiosInstance } from 'axios'
import type { SignupData, RequestOTPData, VerifyOTPData, AuthTokens, User } from '@/types/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * سرویس API برای ارتباط با backend
 */
class APIService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // اضافه کردن token به headerها در صورت وجود
    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    })
  }

  /**
   * ثبت‌نام کاربر جدید
   */
  async signup(data: SignupData): Promise<User> {
    const response = await this.client.post<User>('/api/v1/auth/signup', data)
    return response.data
  }

  /**
   * درخواست کد OTP
   */
  async requestOTP(data: RequestOTPData): Promise<{ message: string; email: string }> {
    const response = await this.client.post('/api/v1/auth/request-otp', data)
    return response.data
  }

  /**
   * تایید کد OTP و دریافت توکن
   */
  async verifyOTP(data: VerifyOTPData): Promise<AuthTokens> {
    const response = await this.client.post<AuthTokens>('/api/v1/auth/verify-otp', data)
    
    // ذخیره توکن‌ها در localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
    }
    
    return response.data
  }

  /**
   * تازه‌سازی access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await this.client.post<AuthTokens>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    })
    
    // ذخیره توکن‌های جدید
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
    }
    
    return response.data
  }

  /**
   * دریافت اطلاعات پروفایل کاربر
   */
  async getProfile(): Promise<User> {
    const response = await this.client.get<User>('/api/v1/users/me')
    return response.data
  }

  /**
   * خروج از سیستم
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }
}

export const apiService = new APIService()
