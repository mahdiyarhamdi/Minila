'use client'

import { useEffect, useState } from 'react'
import { apiService, AdminDashboardStats, AdminChartData, AdminRecentActivity, AdminGrowthMetrics } from '@/lib/api'
import { 
  AdvancedLineChart, 
  AdvancedBarChart, 
  AdvancedPieChart,
  KPICard,
  MetricTable,
  TrendIndicator,
} from '@/components/admin'

// Icons
const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

const VerifiedIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const CommunitiesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const RequestsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  const [growthMetrics, setGrowthMetrics] = useState<AdminGrowthMetrics | null>(null)
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

      const [statsData, growthData, usersChartData, cardsChartData, activitiesData] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getAdminGrowthMetrics(),
        apiService.getAdminUsersChart(chartDays),
        apiService.getAdminCardsChart(chartDays),
        apiService.getAdminRecentActivities(10),
      ])

      setStats(statsData)
      setGrowthMetrics(growthData)
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
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="text-neutral-500 text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-red-600 mb-4 text-lg">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
        >
          تلاش مجدد
        </button>
      </div>
    )
  }

  if (!stats || !growthMetrics) return null

  // Prepare metric table data
  const metricTableRows = [
    {
      label: 'کاربران',
      today: stats.new_users_today,
      week: stats.new_users_week,
      month: stats.new_users_month,
      growth: growthMetrics.users_growth_weekly,
      icon: <UsersIcon />,
    },
    {
      label: 'کارت‌ها',
      today: stats.new_cards_today,
      week: stats.new_cards_week,
      month: stats.new_cards_month,
      growth: growthMetrics.cards_growth_weekly,
      icon: <CardsIcon />,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">داشبورد تحلیلی</h1>
          <p className="text-neutral-500 mt-1">نمای کلی از وضعیت سیستم و متریک‌های کلیدی</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          بروزرسانی
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="کاربران جدید"
          value={stats.new_users_week}
          icon={<UsersIcon />}
          trend={{ value: growthMetrics.users_growth_weekly, label: 'هفتگی' }}
          sparklineData={growthMetrics.users_sparkline}
          color="primary"
        />
        <KPICard
          title="کارت‌های جدید"
          value={stats.new_cards_week}
          icon={<CardsIcon />}
          trend={{ value: growthMetrics.cards_growth_weekly, label: 'هفتگی' }}
          sparklineData={growthMetrics.cards_sparkline}
          color="warning"
        />
        <KPICard
          title="نرخ تایید ایمیل"
          value={`${growthMetrics.email_verification_rate.toFixed(1)}%`}
          icon={<VerifiedIcon />}
          description="از کل کاربران"
          color="success"
        />
        <KPICard
          title="نرخ فعالیت"
          value={`${growthMetrics.user_activity_rate.toFixed(1)}%`}
          icon={<CommunitiesIcon />}
          description="کاربران فعال"
          color="neutral"
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-neutral-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-neutral-900">{stats.total_users.toLocaleString('fa-IR')}</p>
          <p className="text-xs text-neutral-500 mt-1">کل کاربران</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-neutral-900">{stats.active_users.toLocaleString('fa-IR')}</p>
          <p className="text-xs text-neutral-500 mt-1">کاربران فعال</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-neutral-900">{stats.total_cards.toLocaleString('fa-IR')}</p>
          <p className="text-xs text-neutral-500 mt-1">کل کارت‌ها</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-neutral-900">{stats.total_communities.toLocaleString('fa-IR')}</p>
          <p className="text-xs text-neutral-500 mt-1">کامیونیتی‌ها</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-amber-600">{stats.pending_requests.toLocaleString('fa-IR')}</p>
          <p className="text-xs text-neutral-500 mt-1">درخواست معلق</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-red-600">{stats.open_reports.toLocaleString('fa-IR')}</p>
          <p className="text-xs text-neutral-500 mt-1">گزارش باز</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800">روند ثبت‌نام کاربران</h3>
            <select
              value={chartDays}
              onChange={(e) => setChartDays(Number(e.target.value))}
              className="text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value={7}>۷ روز اخیر</option>
              <option value={30}>۳۰ روز اخیر</option>
              <option value={90}>۹۰ روز اخیر</option>
            </select>
          </div>
          {usersChart && (
            <AdvancedLineChart
              labels={usersChart.labels}
              datasets={usersChart.datasets}
              height={280}
            />
          )}
        </div>

        {/* Cards Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800">کارت‌های جدید</h3>
          </div>
          {cardsChart && (
            <AdvancedBarChart
              labels={cardsChart.labels}
              datasets={cardsChart.datasets}
              height={280}
            />
          )}
        </div>
      </div>

      {/* Comparison & Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparison Cards */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
          <h3 className="font-semibold text-neutral-800 mb-6">مقایسه هفتگی</h3>
          <div className="space-y-6">
            {/* Users Comparison */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600">کاربران</span>
                <TrendIndicator value={growthMetrics.users_growth_weekly} size="sm" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-xs text-neutral-400 mb-1">این هفته</div>
                  <div className="text-xl font-bold text-primary-600">
                    {growthMetrics.this_week_users.toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="w-px h-10 bg-neutral-200"></div>
                <div className="flex-1">
                  <div className="text-xs text-neutral-400 mb-1">هفته قبل</div>
                  <div className="text-xl font-bold text-neutral-400">
                    {growthMetrics.last_week_users.toLocaleString('fa-IR')}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-6">
              {/* Cards Comparison */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600">کارت‌ها</span>
                <TrendIndicator value={growthMetrics.cards_growth_weekly} size="sm" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-xs text-neutral-400 mb-1">این هفته</div>
                  <div className="text-xl font-bold text-amber-600">
                    {growthMetrics.this_week_cards.toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="w-px h-10 bg-neutral-200"></div>
                <div className="flex-1">
                  <div className="text-xs text-neutral-400 mb-1">هفته قبل</div>
                  <div className="text-xl font-bold text-neutral-400">
                    {growthMetrics.last_week_cards.toLocaleString('fa-IR')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <AdvancedPieChart
          title="توزیع کارت‌ها"
          data={[
            { label: 'مسافر', value: stats.traveler_cards, color: '#00A8E8' },
            { label: 'فرستنده', value: stats.sender_cards, color: '#E5C189' },
          ]}
          size={180}
        />

        {/* Daily Averages */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
          <h3 className="font-semibold text-neutral-800 mb-6">میانگین روزانه</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                  <UsersIcon />
                </div>
                <span className="text-sm text-neutral-700">ثبت‌نام</span>
              </div>
              <span className="text-lg font-bold text-primary-600">
                {growthMetrics.avg_daily_users.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                  <CardsIcon />
                </div>
                <span className="text-sm text-neutral-700">کارت</span>
              </div>
              <span className="text-lg font-bold text-amber-600">
                {growthMetrics.avg_daily_cards.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                  <MessagesIcon />
                </div>
                <span className="text-sm text-neutral-700">پیام</span>
              </div>
              <span className="text-lg font-bold text-emerald-600">
                {growthMetrics.avg_daily_messages.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Table & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metrics Table */}
        <MetricTable
          title="خلاصه عملکرد"
          rows={metricTableRows}
        />

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
          <h3 className="font-semibold text-neutral-800 mb-4">رویدادهای اخیر</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-neutral-400 text-center py-8">رویدادی یافت نشد</p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-800">
                      <span className="font-medium">{eventTypeLabels[activity.event_type] || activity.event_type}</span>
                      {activity.actor_email && (
                        <span className="text-neutral-500"> توسط {activity.actor_email}</span>
                      )}
                      {activity.target_email && (
                        <span className="text-neutral-500"> برای {activity.target_email}</span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(activity.created_at).toLocaleString('fa-IR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
