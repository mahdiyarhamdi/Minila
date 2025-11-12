import axios, { AxiosInstance } from 'axios'
import type { SignupData, RequestOTPData, VerifyOTPData, AuthTokens, User } from '@/types/auth'
import type { Card, CardCreate, CardUpdate, CardFilter, CardListResponse } from '@/types/card'
import type { Community, CommunityCreate, CommunityUpdate, CommunityListResponse, JoinRequest, JoinRequestListResponse, Member, MemberListResponse } from '@/types/community'
import type { Message, MessageCreate, MessageListResponse, Conversation, ConversationListResponse } from '@/types/message'

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
   * تایید ایمیل با کد OTP
   */
  async verifyEmail(data: { email: string; otp_code: string }): Promise<AuthTokens> {
    const response = await this.client.post<AuthTokens>('/api/v1/auth/verify-email', data)
    
    // ذخیره توکن‌ها در localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
    }
    
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
   * ورود با رمز عبور
   */
  async loginWithPassword(data: { email: string; password: string }): Promise<AuthTokens> {
    const response = await this.client.post<AuthTokens>('/api/v1/auth/login-password', data)
    
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
   * تغییر رمز عبور
   */
  async changePassword(data: { old_password: string; new_password: string }): Promise<{ message: string }> {
    const response = await this.client.put('/api/v1/users/me/password', data)
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

  // ==================== Cards API ====================

  /**
   * دریافت لیست کارت‌ها با فیلتر
   */
  async getCards(filters?: CardFilter): Promise<CardListResponse> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value))
        }
      })
    }
    const response = await this.client.get<CardListResponse>(`/api/v1/cards?${params.toString()}`)
    return response.data
  }

  /**
   * دریافت جزئیات یک کارت
   */
  async getCardById(id: number): Promise<Card> {
    const response = await this.client.get<Card>(`/api/v1/cards/${id}`)
    return response.data
  }

  /**
   * ایجاد کارت جدید
   */
  async createCard(data: CardCreate): Promise<Card> {
    const response = await this.client.post<Card>('/api/v1/cards', data)
    return response.data
  }

  /**
   * ویرایش کارت
   */
  async updateCard(id: number, data: CardUpdate): Promise<Card> {
    const response = await this.client.put<Card>(`/api/v1/cards/${id}`, data)
    return response.data
  }

  /**
   * حذف کارت
   */
  async deleteCard(id: number): Promise<void> {
    await this.client.delete(`/api/v1/cards/${id}`)
  }

  /**
   * دریافت کارت‌های خودم
   */
  async getMyCards(): Promise<CardListResponse> {
    const response = await this.client.get<CardListResponse>('/api/v1/users/me/cards')
    return response.data
  }

  // ==================== Communities API ====================

  /**
   * دریافت لیست کامیونیتی‌ها
   */
  async getCommunities(page: number = 1, page_size: number = 20): Promise<CommunityListResponse> {
    const response = await this.client.get<CommunityListResponse>(`/api/v1/communities?page=${page}&page_size=${page_size}`)
    return response.data
  }

  /**
   * دریافت جزئیات یک کامیونیتی
   */
  async getCommunityById(id: number): Promise<Community> {
    const response = await this.client.get<Community>(`/api/v1/communities/${id}`)
    return response.data
  }

  /**
   * ایجاد کامیونیتی جدید
   */
  async createCommunity(data: CommunityCreate): Promise<Community> {
    const response = await this.client.post<Community>('/api/v1/communities', data)
    return response.data
  }

  /**
   * ویرایش کامیونیتی
   */
  async updateCommunity(id: number, data: CommunityUpdate): Promise<Community> {
    const response = await this.client.put<Community>(`/api/v1/communities/${id}`, data)
    return response.data
  }

  /**
   * درخواست عضویت در کامیونیتی
   */
  async joinCommunityRequest(communityId: number): Promise<JoinRequest> {
    const response = await this.client.post<JoinRequest>(`/api/v1/communities/${communityId}/join`)
    return response.data
  }

  /**
   * دریافت کامیونیتی‌های من
   */
  async getMyCommunities(): Promise<CommunityListResponse> {
    const response = await this.client.get<CommunityListResponse>('/api/v1/users/me/communities')
    return response.data
  }

  /**
   * دریافت درخواست‌های عضویت یک کامیونیتی
   */
  async getJoinRequests(communityId: number, page: number = 1): Promise<JoinRequestListResponse> {
    const response = await this.client.get<JoinRequestListResponse>(`/api/v1/communities/${communityId}/requests?page=${page}`)
    return response.data
  }

  /**
   * تایید درخواست عضویت
   */
  async approveJoinRequest(communityId: number, requestId: number): Promise<void> {
    await this.client.post(`/api/v1/communities/${communityId}/requests/${requestId}/approve`)
  }

  /**
   * رد درخواست عضویت
   */
  async rejectJoinRequest(communityId: number, requestId: number): Promise<void> {
    await this.client.post(`/api/v1/communities/${communityId}/requests/${requestId}/reject`)
  }

  /**
   * دریافت اعضای یک کامیونیتی
   */
  async getCommunityMembers(communityId: number, page: number = 1): Promise<MemberListResponse> {
    const response = await this.client.get<MemberListResponse>(`/api/v1/communities/${communityId}/members?page=${page}`)
    return response.data
  }

  /**
   * حذف عضو از کامیونیتی (ban)
   */
  async removeCommunityMember(communityId: number, userId: number): Promise<void> {
    await this.client.delete(`/api/v1/communities/${communityId}/members/${userId}`)
  }

  // ==================== Messages API ====================

  /**
   * دریافت لیست مکالمات
   */
  async getConversations(): Promise<ConversationListResponse> {
    const response = await this.client.get<ConversationListResponse>('/api/v1/messages/conversations')
    return response.data
  }

  /**
   * دریافت پیام‌ها با یک کاربر
   */
  async getMessages(userId: number, page: number = 1): Promise<MessageListResponse> {
    const response = await this.client.get<MessageListResponse>(`/api/v1/messages/${userId}?page=${page}`)
    return response.data
  }

  /**
   * ارسال پیام
   */
  async sendMessage(data: MessageCreate): Promise<Message> {
    const response = await this.client.post<Message>('/api/v1/messages', data)
    return response.data
  }

  /**
   * علامت‌گذاری پیام به عنوان خوانده شده
   */
  async markMessageAsRead(messageId: number): Promise<void> {
    await this.client.put(`/api/v1/messages/${messageId}/read`)
  }

  // ==================== Profile & Block API ====================

  /**
   * ویرایش پروفایل
   */
  async updateProfile(data: { first_name?: string; last_name?: string }): Promise<User> {
    const response = await this.client.put<User>('/api/v1/users/me', data)
    return response.data
  }

  /**
   * دریافت لیست کاربران بلاک شده
   */
  async getBlockedUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/api/v1/users/me/blocked')
    return response.data
  }

  /**
   * بلاک کردن کاربر
   */
  async blockUser(userId: number): Promise<void> {
    await this.client.post(`/api/v1/users/block/${userId}`)
  }

  /**
   * آنبلاک کردن کاربر
   */
  async unblockUser(userId: number): Promise<void> {
    await this.client.delete(`/api/v1/users/block/${userId}`)
  }

  // ==================== Location API ====================

  /**
   * جستجوی کشورها
   */
  async searchCountries(
    query: string,
    limit: number = 10
  ): Promise<import('@/types/location').CountrySearchResult> {
    const response = await this.client.get('/api/v1/locations/countries/search', {
      params: { q: query, limit },
    })
    return response.data
  }

  /**
   * جستجوی شهرها در یک کشور
   */
  async searchCities(
    countryId: number,
    query: string,
    limit: number = 10
  ): Promise<import('@/types/location').CitySearchResult> {
    const response = await this.client.get('/api/v1/locations/cities/search', {
      params: { country_id: countryId, q: query, limit },
    })
    return response.data
  }

  /**
   * دریافت اطلاعات یک کشور
   */
  async getCountry(countryId: number): Promise<import('@/types/location').Country> {
    const response = await this.client.get(`/api/v1/locations/countries/${countryId}`)
    return response.data
  }

  /**
   * دریافت اطلاعات یک شهر
   */
  async getCity(cityId: number): Promise<import('@/types/location').City> {
    const response = await this.client.get(`/api/v1/locations/cities/${cityId}`)
    return response.data
  }

  /**
   * دریافت همه کشورها
   */
  async getAllCountries(
    limit: number = 250
  ): Promise<import('@/types/location').CountrySearchResult> {
    const response = await this.client.get('/api/v1/locations/countries', {
      params: { limit },
    })
    return response.data
  }

  /**
   * دریافت همه شهرهای یک کشور
   */
  async getCitiesByCountry(
    countryId: number,
    limit: number = 500
  ): Promise<import('@/types/location').CitySearchResult> {
    const response = await this.client.get(
      `/api/v1/locations/countries/${countryId}/cities`,
      { params: { limit } }
    )
    return response.data
  }
}

export const apiService = new APIService()
