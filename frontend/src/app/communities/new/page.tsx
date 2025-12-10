'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateCommunity } from '@/hooks/useCommunities'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Button from '@/components/Button'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'
import { apiService } from '@/lib/api'
import type { CommunityCreate } from '@/types/community'

/**
 * صفحه ایجاد کامیونیتی جدید
 */
export default function NewCommunityPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const createMutation = useCreateCommunity()

  const [formData, setFormData] = useState<CommunityCreate>({
    name: '',
    slug: '',
    bio: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [slugMessage, setSlugMessage] = useState('')
  const [slugCheckTimeout, setSlugCheckTimeout] = useState<NodeJS.Timeout | null>(null)

  // تبدیل متن به slug معتبر
  const normalizeSlug = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 50)
  }

  // چک کردن در دسترس بودن slug
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (slug.length < 3) {
      setSlugStatus('invalid')
      setSlugMessage('آیدی باید حداقل 3 کاراکتر باشد')
      return
    }

    setSlugStatus('checking')
    setSlugMessage('در حال بررسی...')

    try {
      const result = await apiService.checkCommunitySlug(slug)
      if (result.available) {
        setSlugStatus('available')
        setSlugMessage('این آیدی در دسترس است ✓')
      } else {
        setSlugStatus('taken')
        setSlugMessage(result.message)
      }
    } catch {
      setSlugStatus('invalid')
      setSlugMessage('خطا در بررسی آیدی')
    }
  }, [])

  // Handle slug input change with debounce
  const handleSlugChange = useCallback((value: string) => {
    const normalized = normalizeSlug(value)
    setFormData(prev => ({ ...prev, slug: normalized }))
    
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: '' }))
    }

    // Clear previous timeout
    if (slugCheckTimeout) {
      clearTimeout(slugCheckTimeout)
    }

    if (normalized.length === 0) {
      setSlugStatus('idle')
      setSlugMessage('')
      return
    }

    // Debounce API call
    const timeout = setTimeout(() => {
      checkSlugAvailability(normalized)
    }, 500)
    
    setSlugCheckTimeout(timeout)
  }, [slugCheckTimeout, checkSlugAvailability, errors.slug])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (slugCheckTimeout) {
        clearTimeout(slugCheckTimeout)
      }
    }
  }, [slugCheckTimeout])

  const handleChange = (field: keyof CommunityCreate, value: string) => {
    if (field === 'slug') {
      handleSlugChange(value)
    } else {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
      }
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'نام کامیونیتی الزامی است'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'نام کامیونیتی باید حداقل 3 کاراکتر باشد'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'آیدی کامیونیتی الزامی است'
    } else if (formData.slug.trim().length < 3) {
      newErrors.slug = 'آیدی باید حداقل 3 کاراکتر باشد'
    } else if (!/^[a-z][a-z0-9_]{2,49}$/.test(formData.slug)) {
      newErrors.slug = 'آیدی باید با حرف انگلیسی شروع شود و فقط شامل حروف کوچک، اعداد و آندرلاین باشد'
    } else if (slugStatus === 'taken') {
      newErrors.slug = 'این آیدی قبلاً استفاده شده است'
    } else if (slugStatus === 'checking') {
      newErrors.slug = 'لطفاً صبر کنید تا بررسی آیدی تمام شود'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      showToast('error', 'لطفاً تمام فیلدهای الزامی را پر کنید')
      return
    }

    try {
      const newCommunity = await createMutation.mutateAsync(formData)
      showToast('success', 'کامیونیتی با موفقیت ایجاد شد')
      router.push(`/communities/${newCommunity.id}`)
    } catch (error: unknown) {
      showToast('error', extractErrorMessage(error))
    }
  }

  // رنگ وضعیت slug
  const getSlugStatusColor = () => {
    switch (slugStatus) {
      case 'available':
        return 'text-green-600'
      case 'taken':
      case 'invalid':
        return 'text-red-600'
      case 'checking':
        return 'text-yellow-600'
      default:
        return 'text-neutral-500'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
            ایجاد کامیونیتی جدید
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-light">
            یک کامیونیتی برای گروه خود بسازید
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card variant="elevated" className="p-6 sm:p-8 mb-6">
            <div className="space-y-6">
              {/* نام کامیونیتی */}
              <Input
                label="نام کامیونیتی *"
                placeholder="مثلاً: مسافران تهران-مشهد"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                helperText="نامی واضح و توصیفی انتخاب کنید"
              />

              {/* آیدی کامیونیتی */}
              <div>
                <Input
                  label="آیدی کامیونیتی *"
                  placeholder="مثلاً: tehran_travelers"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  error={errors.slug}
                  helperText="آیدی یکتا برای جستجو و اشتراک‌گذاری (فقط حروف انگلیسی کوچک، اعداد و آندرلاین)"
                  dir="ltr"
                  className="font-mono"
                />
                {slugMessage && !errors.slug && (
                  <p className={`text-sm mt-1 ${getSlugStatusColor()}`}>
                    {slugStatus === 'checking' && (
                      <span className="inline-block animate-spin ml-1">⟳</span>
                    )}
                    {slugMessage}
                  </p>
                )}
              </div>

              {/* توضیحات */}
              <Textarea
                label="توضیحات"
                placeholder="درباره این کامیونیتی بنویسید..."
                rows={5}
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                helperText="اختیاری - بگویید این کامیونیتی برای چیست و چه کسانی می‌توانند عضو شوند"
              />

              {/* توضیحات اضافی */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">نکته مهم</p>
                    <p className="font-light">
                      شما به‌عنوان سازنده، به‌صورت خودکار مدیر این کامیونیتی خواهید بود و می‌توانید درخواست‌های عضویت را بررسی کنید.
                    </p>
                    <p className="font-light mt-2">
                      <strong>آیدی کامیونیتی</strong> برای جستجو و اشتراک‌گذاری استفاده می‌شود و پس از ساخت قابل تغییر نیست.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full sm:w-auto">
              انصراف
            </Button>
            <Button 
              type="submit" 
              isLoading={createMutation.isPending}
              disabled={slugStatus === 'checking' || slugStatus === 'taken'}
              className="w-full sm:w-auto"
            >
              ایجاد کامیونیتی
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
