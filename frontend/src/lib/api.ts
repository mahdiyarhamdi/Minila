import axios, { AxiosInstance } from 'axios'
import type { SignupData, RequestOTPData, VerifyOTPData, AuthTokens, User } from '@/types/auth'
import type { Card, CardCreate, CardUpdate, CardFilter, CardListResponse, PriceSuggestion, PriceSuggestionParams } from '@/types/card'
import type { Community, CommunityCreate, CommunityUpdate, CommunityListResponse, JoinRequest, JoinRequestListResponse, Member, MemberListResponse, SlugCheckResponse } from '@/types/community'
import type { Message, MessageCreate, MessageListResponse, Conversation, ConversationListResponse } from '@/types/message'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * سرویس API برای ارتباط با backend
 */
class APIService {
  private client: AxiosInstance
  private isRefreshing = false
  private refreshSubscribers: ((token: string) => void)[] = []

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

    // تازه‌سازی خودکار token در صورت 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // اگر 401 گرفتیم و قبلاً retry نکرده‌ایم
        if (error.response?.status === 401 && !originalRequest._retry) {
          const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
          
          if (refreshToken) {
            if (this.isRefreshing) {
              // اگر در حال تازه‌سازی هستیم، منتظر می‌مانیم
              return new Promise((resolve) => {
                this.refreshSubscribers.push((token: string) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`
                  resolve(this.client(originalRequest))
                })
              })
            }

            originalRequest._retry = true
            this.isRefreshing = true

            try {
              const tokens = await this.refreshToken(refreshToken)
              this.isRefreshing = false
              
              // اجرای درخواست‌های در انتظار
              this.refreshSubscribers.forEach((cb) => cb(tokens.access_token))
              this.refreshSubscribers = []
              
              // تکرار درخواست اصلی با token جدید
              originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`
              return this.client(originalRequest)
            } catch (refreshError) {
              this.isRefreshing = false
              this.refreshSubscribers = []
              // توکن تازه‌سازی هم منقضی شده - خروج کاربر
              this.logout()
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/login'
              }
              return Promise.reject(refreshError)
            }
          }
        }
        
        // تبدیل خطای Pydantic/FastAPI به پیام خوانا
        if (error.response?.data) {
          const data = error.response.data
          // خطای 422 (validation error)
          if (Array.isArray(data.detail)) {
            const messages = data.detail.map((err: any) => 
              typeof err === 'string' ? err : err.msg || JSON.stringify(err)
            ).join(', ')
            error.message = messages || 'خطای اعتبارسنجی'
          } else if (typeof data.detail === 'string') {
            error.message = data.detail
          } else if (data.message) {
            error.message = data.message
          }
        }
        
        return Promise.reject(error)
      }
    )
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
    const response = await this.client.get<CardListResponse>(`/api/v1/cards/?${params.toString()}`)
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
    const response = await this.client.post<Card>('/api/v1/cards/', data)
    return response.data
  }

  /**
   * ویرایش کارت
   */
  async updateCard(id: number, data: CardUpdate): Promise<Card> {
    const response = await this.client.patch<Card>(`/api/v1/cards/${id}`, data)
    return response.data
  }

  /**
   * حذف کارت
   */
  async deleteCard(id: number): Promise<void> {
    await this.client.delete(`/api/v1/cards/${id}`)
  }

  /**
   * Record card view (impression)
   */
  async recordCardView(cardId: number): Promise<void> {
    try {
      await this.client.post(`/api/v1/cards/${cardId}/view`)
    } catch (error) {
      // Silently fail - analytics should not break the UI
      console.debug('Failed to record card view:', error)
    }
  }

  /**
   * Record card click
   */
  async recordCardClick(cardId: number): Promise<void> {
    try {
      await this.client.post(`/api/v1/cards/${cardId}/click`)
    } catch (error) {
      // Silently fail - analytics should not break the UI
      console.debug('Failed to record card click:', error)
    }
  }

  /**
   * Get card statistics
   */
  async getCardStats(cardId: number): Promise<{ card_id: number; view_count: number; click_count: number }> {
    const response = await this.client.get<{ card_id: number; view_count: number; click_count: number }>(`/api/v1/cards/${cardId}/stats`)
    return response.data
  }

  /**
   * دریافت کارت‌های خودم
   */
  async getMyCards(): Promise<CardListResponse> {
    const response = await this.client.get<CardListResponse>('/api/v1/users/me/cards')
    return response.data
  }

  /**
   * دریافت قیمت پیشنهادی برای یک مسیر
   */
  async getPriceSuggestion(params: PriceSuggestionParams): Promise<PriceSuggestion> {
    const searchParams = new URLSearchParams()
    searchParams.append('origin_city_id', String(params.origin_city_id))
    searchParams.append('destination_city_id', String(params.destination_city_id))
    if (params.travel_date) {
      searchParams.append('travel_date', params.travel_date)
    }
    if (params.weight !== undefined) {
      searchParams.append('weight', String(params.weight))
    }
    if (params.category_id !== undefined) {
      searchParams.append('category_id', String(params.category_id))
    }
    const response = await this.client.get<PriceSuggestion>(`/api/v1/cards/price-suggestion/?${searchParams.toString()}`)
    return response.data
  }

  // ==================== Communities API ====================

  /**
   * دریافت لیست کامیونیتی‌ها
   */
  async getCommunities(page: number = 1, page_size: number = 20): Promise<CommunityListResponse> {
    const response = await this.client.get<CommunityListResponse>(`/api/v1/communities/?page=${page}&page_size=${page_size}`)
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
   * بررسی در دسترس بودن آیدی کامیونیتی
   */
  async checkCommunitySlug(slug: string): Promise<SlugCheckResponse> {
    const response = await this.client.get<SlugCheckResponse>(`/api/v1/communities/check-slug/${slug}`)
    return response.data
  }

  /**
   * ایجاد کامیونیتی جدید
   */
  async createCommunity(data: CommunityCreate): Promise<Community> {
    const response = await this.client.post<Community>('/api/v1/communities/', data)
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
   * دریافت درخواست‌های عضویت من
   */
  async getMyJoinRequests(): Promise<JoinRequest[]> {
    const response = await this.client.get<JoinRequest[]>('/api/v1/users/me/join-requests')
    return response.data
  }

  /**
   * دریافت درخواست‌های عضویت کامیونیتی‌های من (به‌عنوان owner/manager)
   */
  async getManagedCommunityRequests(): Promise<JoinRequest[]> {
    const response = await this.client.get<JoinRequest[]>('/api/v1/users/me/managed-requests')
    return response.data
  }

  /**
   * لغو درخواست عضویت
   */
  async cancelJoinRequest(requestId: number): Promise<void> {
    await this.client.delete(`/api/v1/users/me/join-requests/${requestId}`)
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
   * حذف عضو از کامیونیتی
   */
  async removeCommunityMember(communityId: number, userId: number): Promise<void> {
    await this.client.delete(`/api/v1/communities/${communityId}/members/${userId}`)
  }

  /**
   * تغییر نقش عضو در کامیونیتی
   */
  async changeMemberRole(communityId: number, userId: number, role: 'member' | 'manager'): Promise<Member> {
    const response = await this.client.patch<Member>(
      `/api/v1/communities/${communityId}/members/${userId}/role?role=${role}`
    )
    return response.data
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
    const response = await this.client.post<Message>('/api/v1/messages/', data)
    return response.data
  }

  /**
   * علامت‌گذاری تمام پیام‌های یک مکالمه به عنوان خوانده شده
   */
  async markConversationAsRead(userId: number): Promise<{ message: string; count: number }> {
    const response = await this.client.post<{ message: string; count: number }>(`/api/v1/messages/mark-read/${userId}`)
    return response.data
  }

  /**
   * دریافت تعداد کل پیام‌های خوانده نشده
   */
  async getUnreadMessagesCount(): Promise<number> {
    const response = await this.client.get<{ unread_count: number }>('/api/v1/messages/unread-count')
    return response.data.unread_count
  }

  // ==================== Profile & Block API ====================

  /**
   * ویرایش پروفایل
   */
  async updateProfile(data: { first_name?: string; last_name?: string }): Promise<User> {
    const response = await this.client.put<User>('/api/v1/users/me/', data)
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

  // ==================== Shared Communities API ====================

  /**
   * بررسی وجود کامیونیتی مشترک با کاربر
   */
  async checkSharedCommunities(userId: number): Promise<{ has_shared_community: boolean; user_id: number }> {
    const response = await this.client.get<{ has_shared_community: boolean; user_id: number }>(
      `/api/v1/users/${userId}/shared-communities`
    )
    return response.data
  }

  /**
   * دریافت کامیونیتی‌های یک کاربر
   */
  async getUserCommunities(userId: number, page: number = 1, pageSize: number = 50): Promise<CommunityListResponse> {
    const response = await this.client.get<CommunityListResponse>(
      `/api/v1/users/${userId}/communities`,
      { params: { page, page_size: pageSize } }
    )
    return response.data
  }

  // ==================== Admin API ====================

  /**
   * دریافت آمار داشبورد ادمین
   */
  async getAdminStats(): Promise<AdminDashboardStats> {
    const response = await this.client.get<AdminDashboardStats>('/api/v1/admin/stats')
    return response.data
  }

  /**
   * دریافت داده‌های نمودار کاربران
   */
  async getAdminUsersChart(days: number = 30): Promise<AdminChartData> {
    const response = await this.client.get<AdminChartData>(`/api/v1/admin/stats/users-chart?days=${days}`)
    return response.data
  }

  /**
   * دریافت داده‌های نمودار کارت‌ها
   */
  async getAdminCardsChart(days: number = 30): Promise<AdminChartData> {
    const response = await this.client.get<AdminChartData>(`/api/v1/admin/stats/cards-chart?days=${days}`)
    return response.data
  }

  /**
   * دریافت رویدادهای اخیر
   */
  async getAdminRecentActivities(limit: number = 10): Promise<AdminRecentActivity[]> {
    const response = await this.client.get<AdminRecentActivity[]>(`/api/v1/admin/stats/recent-activities?limit=${limit}`)
    return response.data
  }

  /**
   * دریافت لیست کاربران (ادمین)
   */
  async getAdminUsers(params: AdminUsersParams = {}): Promise<AdminPaginatedResponse<AdminUser>> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const response = await this.client.get<AdminPaginatedResponse<AdminUser>>(`/api/v1/admin/users?${searchParams.toString()}`)
    return response.data
  }

  /**
   * بن/آن‌بن کاربر (ادمین)
   */
  async banUser(userId: number, isActive: boolean, reason?: string): Promise<{ message: string }> {
    const response = await this.client.put<{ message: string }>(`/api/v1/admin/users/${userId}/ban`, {
      is_active: isActive,
      reason
    })
    return response.data
  }

  /**
   * تغییر وضعیت ادمین کاربر
   */
  async toggleAdminStatus(userId: number, isAdmin: boolean): Promise<{ message: string }> {
    const response = await this.client.put<{ message: string }>(`/api/v1/admin/users/${userId}/admin`, {
      is_admin: isAdmin
    })
    return response.data
  }

  /**
   * دریافت لیست کامیونیتی‌ها (ادمین)
   */
  async getAdminCommunities(params: AdminCommunitiesParams = {}): Promise<AdminPaginatedResponse<AdminCommunity>> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const response = await this.client.get<AdminPaginatedResponse<AdminCommunity>>(`/api/v1/admin/communities?${searchParams.toString()}`)
    return response.data
  }

  /**
   * حذف کامیونیتی (ادمین)
   */
  async deleteAdminCommunity(communityId: number): Promise<void> {
    await this.client.delete(`/api/v1/admin/communities/${communityId}`)
  }

  /**
   * دریافت لیست کارت‌ها (ادمین)
   */
  async getAdminCards(params: AdminCardsParams = {}): Promise<AdminPaginatedResponse<AdminCard>> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const response = await this.client.get<AdminPaginatedResponse<AdminCard>>(`/api/v1/admin/cards?${searchParams.toString()}`)
    return response.data
  }

  /**
   * حذف کارت (ادمین)
   */
  async deleteAdminCard(cardId: number): Promise<void> {
    await this.client.delete(`/api/v1/admin/cards/${cardId}`)
  }

  /**
   * دریافت لیست گزارش‌ها (ادمین)
   */
  async getAdminReports(params: { page?: number; page_size?: number } = {}): Promise<AdminPaginatedResponse<AdminReport>> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const response = await this.client.get<AdminPaginatedResponse<AdminReport>>(`/api/v1/admin/reports?${searchParams.toString()}`)
    return response.data
  }

  /**
   * بستن گزارش (ادمین)
   */
  async resolveReport(reportId: number, action: string, note?: string): Promise<{ message: string }> {
    const response = await this.client.put<{ message: string }>(`/api/v1/admin/reports/${reportId}/resolve`, {
      action,
      note
    })
    return response.data
  }

  /**
   * دریافت لیست درخواست‌های عضویت (ادمین)
   */
  async getAdminRequests(params: AdminRequestsParams = {}): Promise<AdminPaginatedResponse<AdminRequest>> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const response = await this.client.get<AdminPaginatedResponse<AdminRequest>>(`/api/v1/admin/requests?${searchParams.toString()}`)
    return response.data
  }

  /**
   * دریافت لیست لاگ‌ها (ادمین)
   */
  async getAdminLogs(params: AdminLogsParams = {}): Promise<AdminPaginatedResponse<AdminLog>> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const response = await this.client.get<AdminPaginatedResponse<AdminLog>>(`/api/v1/admin/logs?${searchParams.toString()}`)
    return response.data
  }

  /**
   * دریافت تنظیمات سیستم (ادمین)
   */
  async getAdminSettings(): Promise<AdminSettings> {
    const response = await this.client.get<AdminSettings>('/api/v1/admin/settings')
    return response.data
  }
}

// Admin Types
export interface AdminDashboardStats {
  total_users: number
  active_users: number
  banned_users: number
  admin_users: number
  verified_users: number
  total_communities: number
  total_cards: number
  traveler_cards: number
  sender_cards: number
  total_messages: number
  pending_requests: number
  open_reports: number
  new_users_today: number
  new_users_week: number
  new_users_month: number
  new_cards_today: number
  new_cards_week: number
  new_cards_month: number
}

export interface AdminChartDataset {
  label: string
  data: number[]
  color?: string
}

export interface AdminChartData {
  labels: string[]
  datasets: AdminChartDataset[]
}

export interface AdminRecentActivity {
  id: number
  event_type: string
  description: string
  actor_email?: string
  target_email?: string
  created_at: string
}

export interface AdminUser {
  id: number
  email: string
  first_name?: string
  last_name?: string
  is_active: boolean
  is_admin: boolean
  email_verified: boolean
  created_at: string
  updated_at?: string
  cards_count: number
  communities_count: number
  messages_sent_count: number
}

export interface AdminCommunity {
  id: number
  name: string
  slug: string
  bio?: string
  created_at: string
  updated_at?: string
  owner_id: number
  owner_email: string
  owner_name?: string
  members_count: number
  pending_requests_count: number
}

export interface AdminCard {
  id: number
  is_sender: boolean
  description?: string
  weight?: number
  price_aed?: number
  currency?: string
  created_at: string
  updated_at?: string
  owner_id: number
  owner_email: string
  owner_name?: string
  origin_city: string
  origin_country: string
  destination_city: string
  destination_country: string
  start_time_frame?: string
  end_time_frame?: string
  ticket_date_time?: string
}

export interface AdminReport {
  id: number
  body: string
  is_resolved: boolean
  resolved_at?: string
  resolved_by_id?: number
  created_at: string
  reporter_id?: number
  reporter_email?: string
  reporter_name?: string
  reported_id?: number
  reported_email?: string
  reported_name?: string
  card_id?: number
}

export interface AdminRequest {
  id: number
  is_approved?: boolean
  created_at: string
  updated_at?: string
  user_id: number
  user_email: string
  user_name?: string
  community_id: number
  community_name: string
  community_slug: string
}

export interface AdminLog {
  id: number
  event_type: string
  ip?: string
  user_agent?: string
  payload?: string
  created_at: string
  actor_user_id?: number
  actor_email?: string
  target_user_id?: number
  target_email?: string
  card_id?: number
  community_id?: number
  community_name?: string
}

export interface AdminSettings {
  smtp_configured: boolean
  smtp_host?: string
  redis_configured: boolean
  messages_per_day_limit: number
  app_version: string
  environment: string
}

export interface AdminPaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface AdminUsersParams {
  page?: number
  page_size?: number
  search?: string
  is_active?: boolean
  is_admin?: boolean
  email_verified?: boolean
}

export interface AdminCommunitiesParams {
  page?: number
  page_size?: number
  search?: string
}

export interface AdminCardsParams {
  page?: number
  page_size?: number
  search?: string
  is_sender?: boolean
  owner_id?: number
}

export interface AdminRequestsParams {
  page?: number
  page_size?: number
  status?: string
  community_id?: number
}

export interface AdminLogsParams {
  page?: number
  page_size?: number
  event_type?: string
  actor_user_id?: number
  date_from?: string
  date_to?: string
}

export const apiService = new APIService()
