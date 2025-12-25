'use client'

import { useEffect, useState } from 'react'
import { apiService, AdminDashboardStats, AdminChartData, AdminRecentActivity } from '@/lib/api'
import { StatsCard, SimpleLineChart, SimpleBarChart, SimplePieChart } from '@/components/admin'

// آیکون‌ها
const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const CommunitiesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const CardsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

const MessagesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const RequestsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ReportsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const eventTypeLabels: Record<string, string> = {
  signup: 'ثبت‌نام',
  login_success: 'ورود موفق',
  login_attempt: 'تلاش ورود',
  email_verified: 'تایید ایمیل',
  join_request: 'درخواست عضویت',
  join_approve: 'تایید عضویت',
  join_reject: 'رد عضویت',
  card_create: 'ساخت کارت',
  card_delete: 'حذف کارت',
  message_send: 'ارسال پیام',
  ban: 'مسدود کردن',
  unban: 'رفع مسدودیت',
  grant_admin: 'اعطای ادمین',
  revoke_admin: 'لغو ادمین',
  community_delete: 'حذف کامیونیتی',
  report_resolve: 'بررسی گزارش',
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [usersChart, setUsersChart] = useState<AdminChartData | null>(null)
  const [cardsChart, setCardsChart] = useState<AdminChartData | null>(null)
  const [activities, setActivities] = useState<AdminRecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartDays, setChartDays] = useState(30)

  useEffect(() => {
    loadDashboardData()
  }, [chartDays])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsData, usersChartData, cardsChartData, activitiesData] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getAdminUsersChart(chartDays),
        apiService.getAdminCardsChart(chartDays),
        apiService.getAdminRecentActivities(10),
      ])

      setStats(statsData)
      setUsersChart(usersChartData)
      setCardsChart(cardsChartData)
      setActivities(activitiesData)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('خطا در بارگذاری اطلاعات داشبورد')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">داشبورد</h1>
          <p className="text-neutral-600 mt-1">نمای کلی از وضعیت سیستم</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          بروزرسانی
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="کل کاربران"
          value={stats.total_users}
          icon={<UsersIcon />}
          color="primary"
          description={`${stats.new_users_today} جدید امروز`}
        />
        <StatsCard
          title="کاربران فعال"
          value={stats.active_users}
          icon={<UsersIcon />}
          color="success"
          description={`${stats.banned_users} مسدود`}
        />
        <StatsCard
          title="کامیونیتی‌ها"
          value={stats.total_communities}
          icon={<CommunitiesIcon />}
          color="warning"
        />
        <StatsCard
          title="کل کارت‌ها"
          value={stats.total_cards}
          icon={<CardsIcon />}
          color="neutral"
          description={`${stats.new_cards_today} جدید امروز`}
        />
        <StatsCard
          title="درخواست‌های معلق"
          value={stats.pending_requests}
          icon={<RequestsIcon />}
          color="warning"
        />
        <StatsCard
          title="گزارش‌های باز"
          value={stats.open_reports}
          icon={<ReportsIcon />}
          color="error"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">ثبت‌نام کاربران</h3>
            <select
              value={chartDays}
              onChange={(e) => setChartDays(Number(e.target.value))}
              className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={7}>۷ روز اخیر</option>
              <option value={30}>۳۰ روز اخیر</option>
              <option value={90}>۹۰ روز اخیر</option>
            </select>
          </div>
          {usersChart && (
            <SimpleLineChart
              labels={usersChart.labels}
              datasets={usersChart.datasets}
              height={250}
            />
          )}
        </div>

        {/* Cards Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">کارت‌های جدید</h3>
          </div>
          {cardsChart && (
            <SimpleBarChart
              labels={cardsChart.labels}
              datasets={cardsChart.datasets}
              height={250}
            />
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <SimplePieChart
          title="توزیع کارت‌ها"
          data={[
            { label: 'مسافر', value: stats.traveler_cards, color: '#00A8E8' },
            { label: 'فرستنده', value: stats.sender_cards, color: '#E5C189' },
          ]}
          size={180}
        />

        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">رویدادهای اخیر</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-neutral-500 text-center py-4">رویدادی یافت نشد</p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900">
                      <span className="font-medium">{eventTypeLabels[activity.event_type] || activity.event_type}</span>
                      {activity.actor_email && (
                        <span className="text-neutral-600"> توسط {activity.actor_email}</span>
                      )}
                      {activity.target_email && (
                        <span className="text-neutral-600"> برای {activity.target_email}</span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(activity.created_at).toLocaleString('fa-IR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
          <p className="text-3xl font-bold text-neutral-900">{stats.new_users_week.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-neutral-600 mt-1">کاربر جدید (هفته)</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
          <p className="text-3xl font-bold text-neutral-900">{stats.new_users_month.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-neutral-600 mt-1">کاربر جدید (ماه)</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
          <p className="text-3xl font-bold text-neutral-900">{stats.new_cards_week.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-neutral-600 mt-1">کارت جدید (هفته)</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
          <p className="text-3xl font-bold text-neutral-900">{stats.total_messages.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-neutral-600 mt-1">کل پیام‌ها</p>
        </div>
      </div>
    </div>
  )
}




