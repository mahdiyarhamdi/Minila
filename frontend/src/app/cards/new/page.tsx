'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateCard } from '@/hooks/useCards'
import { useMyCommunities } from '@/hooks/useCommunities'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Textarea from '@/components/Textarea'
import Button from '@/components/Button'
import { useToast } from '@/components/Toast'
import type { CardCreate } from '@/types/card'

/**
 * صفحه ایجاد کارت جدید
 */
export default function NewCardPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const createCardMutation = useCreateCard()
  const { data: communities } = useMyCommunities()

  const [formData, setFormData] = useState<CardCreate>({
    origin: '',
    destination: '',
    travel_date: '',
    capacity_kg: undefined,
    price: undefined,
    category: 'سایر',
    packaging_status: 'بدون بسته‌بندی',
    description: '',
    community_ids: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof CardCreate, value: any) => {
    setFormData({ ...formData, [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.origin.trim()) {
      newErrors.origin = 'مبدأ الزامی است'
    }
    if (!formData.destination.trim()) {
      newErrors.destination = 'مقصد الزامی است'
    }
    if (!formData.category) {
      newErrors.category = 'دسته‌بندی الزامی است'
    }
    if (!formData.packaging_status) {
      newErrors.packaging_status = 'وضعیت بسته‌بندی الزامی است'
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
      // تبدیل مقادیر خالی به undefined
      const submitData = {
        ...formData,
        capacity_kg: formData.capacity_kg ? Number(formData.capacity_kg) : undefined,
        price: formData.price ? Number(formData.price) : undefined,
        travel_date: formData.travel_date || undefined,
        community_ids: formData.community_ids?.length ? formData.community_ids : undefined,
      }

      const newCard = await createCardMutation.mutateAsync(submitData)
      showToast('success', 'کارت با موفقیت ایجاد شد')
      router.push(`/cards/${newCard.id}`)
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'خطا در ایجاد کارت')
    }
  }

  const handleCommunityToggle = (communityId: number) => {
    const current = formData.community_ids || []
    if (current.includes(communityId)) {
      setFormData({
        ...formData,
        community_ids: current.filter((id) => id !== communityId),
      })
    } else {
      setFormData({
        ...formData,
        community_ids: [...current, communityId],
      })
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">
            ایجاد کارت جدید
          </h1>
          <p className="text-neutral-600 font-light">
            اطلاعات سفر یا بار خود را وارد کنید
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card variant="elevated" className="p-6 sm:p-8 mb-6">
            <div className="space-y-6">
              {/* مبدأ و مقصد */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="مبدأ *"
                  placeholder="شهر مبدأ"
                  value={formData.origin}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  error={errors.origin}
                />
                <Input
                  label="مقصد *"
                  placeholder="شهر مقصد"
                  value={formData.destination}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  error={errors.destination}
                />
              </div>

              {/* تاریخ سفر */}
              <Input
                label="تاریخ سفر"
                type="date"
                value={formData.travel_date}
                onChange={(e) => handleChange('travel_date', e.target.value)}
                helperText="اختیاری - تاریخ مورد نظر برای سفر"
              />

              {/* ظرفیت و قیمت */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="ظرفیت (کیلوگرم)"
                  type="number"
                  placeholder="مثال: 20"
                  value={formData.capacity_kg || ''}
                  onChange={(e) => handleChange('capacity_kg', e.target.value)}
                  helperText="اختیاری"
                />
                <Input
                  label="قیمت پیشنهادی (تومان)"
                  type="number"
                  placeholder="مثال: 500000"
                  value={formData.price || ''}
                  onChange={(e) => handleChange('price', e.target.value)}
                  helperText="اختیاری"
                />
              </div>

              {/* دسته‌بندی و بسته‌بندی */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="دسته‌بندی کالا *"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  error={errors.category}
                  options={[
                    { value: 'پوشاک', label: 'پوشاک' },
                    { value: 'خوراکی', label: 'خوراکی' },
                    { value: 'الکترونیک', label: 'الکترونیک' },
                    { value: 'لوازم خانگی', label: 'لوازم خانگی' },
                    { value: 'سایر', label: 'سایر' },
                  ]}
                />
                <Select
                  label="وضعیت بسته‌بندی *"
                  value={formData.packaging_status}
                  onChange={(e) => handleChange('packaging_status', e.target.value)}
                  error={errors.packaging_status}
                  options={[
                    { value: 'بسته‌بندی شده', label: 'بسته‌بندی شده' },
                    { value: 'بدون بسته‌بندی', label: 'بدون بسته‌بندی' },
                  ]}
                />
              </div>

              {/* توضیحات */}
              <Textarea
                label="توضیحات"
                placeholder="توضیحات تکمیلی درباره کارت..."
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                helperText="اختیاری - هر اطلاعات اضافی که فکر می‌کنید مفید باشد"
              />

              {/* انتخاب کامیونیتی‌ها */}
              {communities && communities.items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    نمایش در کامیونیتی‌ها
                  </label>
                  <p className="text-sm text-neutral-600 font-light mb-3">
                    اگر هیچ کامیونیتی انتخاب نکنید، کارت برای همه نمایش داده می‌شود
                  </p>
                  <div className="space-y-2">
                    {communities.items.map((community) => (
                      <label
                        key={community.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.community_ids?.includes(community.id)}
                          onChange={() => handleCommunityToggle(community.id)}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-neutral-900">
                          {community.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              isLoading={createCardMutation.isPending}
            >
              ایجاد کارت
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

