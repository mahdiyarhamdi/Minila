'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateCard } from '@/hooks/useCards'
import { useMyCommunities } from '@/hooks/useCommunities'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Textarea from '@/components/Textarea'
import Button from '@/components/Button'
import Autocomplete from '@/components/Autocomplete'
import DateTimePicker from '@/components/DateTimePicker'
import { useToast } from '@/components/Toast'
import { apiService } from '@/lib/api'
import { extractErrorMessage } from '@/utils/errors'
import type { Country, City } from '@/types/location'

interface AutocompleteOption {
  id: number
  label: string
  value: string
}

interface CardFormData {
  is_sender: boolean
  origin_country_id?: number
  origin_city_id?: number
  destination_country_id?: number
  destination_city_id?: number
  start_time_frame?: string
  end_time_frame?: string
  ticket_date_time?: string
  weight?: number
  is_packed?: boolean
  price_aed?: number
  description?: string
  product_classification_id?: number
  community_ids?: number[]
}

/**
 * صفحه ایجاد کارت جدید
 */
export default function NewCardPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const createCardMutation = useCreateCard()
  const { data: communities } = useMyCommunities()

  // State for location selections
  const [originCountry, setOriginCountry] = useState<AutocompleteOption | null>(null)
  const [originCity, setOriginCity] = useState<AutocompleteOption | null>(null)
  const [destinationCountry, setDestinationCountry] = useState<AutocompleteOption | null>(null)
  const [destinationCity, setDestinationCity] = useState<AutocompleteOption | null>(null)

  const [formData, setFormData] = useState<CardFormData>({
    is_sender: false,
    weight: undefined,
    is_packed: undefined,
    price_aed: undefined,
    description: '',
    community_ids: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof CardFormData, value: any) => {
    setFormData({ ...formData, [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  // جستجوی کشورها
  const searchCountries = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const result = await apiService.searchCountries(query, 10)
      return result.items.map((country: Country) => ({
        id: country.id,
        label: country.name_fa,
        value: String(country.id),
      }))
    } catch (error) {
      console.error('Error searching countries:', error)
      return []
    }
  }, [])

  // جستجوی شهرها
  const searchCities = useCallback((countryId: number) => async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const result = await apiService.searchCities(countryId, query, 10)
      return result.items.map((city: City) => ({
        id: city.id,
        label: `${city.name_fa} (${city.airport_code || ''})`,
        value: String(city.id),
      }))
    } catch (error) {
      console.error('Error searching cities:', error)
      return []
    }
  }, [])

  // هنگامی که کشور مبدأ تغییر می‌کند، شهر را reset کن
  const handleOriginCountryChange = (option: AutocompleteOption | null) => {
    setOriginCountry(option)
    setOriginCity(null)
    if (errors.origin_country_id) {
      setErrors({ ...errors, origin_country_id: '' })
    }
  }

  // هنگامی که کشور مقصد تغییر می‌کند، شهر را reset کن
  const handleDestinationCountryChange = (option: AutocompleteOption | null) => {
    setDestinationCountry(option)
    setDestinationCity(null)
    if (errors.destination_country_id) {
      setErrors({ ...errors, destination_country_id: '' })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!originCountry) {
      newErrors.origin_country = 'کشور مبدأ الزامی است'
    }
    if (!originCity) {
      newErrors.origin_city = 'شهر مبدأ الزامی است'
    }
    if (!destinationCountry) {
      newErrors.destination_country = 'کشور مقصد الزامی است'
    }
    if (!destinationCity) {
      newErrors.destination_city = 'شهر مقصد الزامی است'
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
      // تبدیل مقادیر خالی به undefined و ساخت submitData
      const submitData: any = {
        is_sender: formData.is_sender,
        origin_country_id: originCountry!.id,
        origin_city_id: originCity!.id,
        destination_country_id: destinationCountry!.id,
        destination_city_id: destinationCity!.id,
      }

      // فقط فیلدهایی که مقدار دارند را اضافه کن
      if (formData.weight) {
        submitData.weight = Number(formData.weight)
      }
      if (formData.is_packed !== undefined) {
        submitData.is_packed = formData.is_packed
      }
      if (formData.price_aed) {
        submitData.price_aed = Number(formData.price_aed)
      }
      if (formData.description) {
        submitData.description = formData.description
      }
      if (formData.product_classification_id) {
        submitData.product_classification_id = formData.product_classification_id
      }
      if (formData.community_ids?.length) {
        submitData.community_ids = formData.community_ids
      }

      // Add time fields based on card type
      if (formData.is_sender) {
        if (formData.start_time_frame) {
          submitData.start_time_frame = formData.start_time_frame
        }
        if (formData.end_time_frame) {
          submitData.end_time_frame = formData.end_time_frame
        }
      } else {
        if (formData.ticket_date_time) {
          submitData.ticket_date_time = formData.ticket_date_time
        }
      }

      const newCard = await createCardMutation.mutateAsync(submitData)
      showToast('success', 'کارت با موفقیت ایجاد شد')
      router.push(`/cards/${newCard.id}`)
    } catch (error: any) {
      showToast('error', extractErrorMessage(error))
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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
            ایجاد کارت جدید
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-light">
            اطلاعات سفر یا بار خود را وارد کنید
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card variant="elevated" className="p-6 sm:p-8 mb-6">
            <div className="space-y-6">
              {/* مبدأ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Autocomplete
                  label="کشور مبدأ"
                  placeholder="جستجوی کشور..."
                  value={originCountry}
                  onChange={handleOriginCountryChange}
                  onSearch={searchCountries}
                  error={errors.origin_country}
                  required
                />
                <Autocomplete
                  label="شهر مبدأ"
                  placeholder="جستجوی شهر..."
                  value={originCity}
                  onChange={(option) => {
                    setOriginCity(option)
                    if (errors.origin_city) {
                      setErrors({ ...errors, origin_city: '' })
                    }
                  }}
                  onSearch={originCountry ? searchCities(originCountry.id) : async () => []}
                  disabled={!originCountry}
                  error={errors.origin_city}
                  helperText={!originCountry ? 'ابتدا کشور را انتخاب کنید' : undefined}
                  required
                />
              </div>

              {/* مقصد */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Autocomplete
                  label="کشور مقصد"
                  placeholder="جستجوی کشور..."
                  value={destinationCountry}
                  onChange={handleDestinationCountryChange}
                  onSearch={searchCountries}
                  error={errors.destination_country}
                  required
                />
                <Autocomplete
                  label="شهر مقصد"
                  placeholder="جستجوی شهر..."
                  value={destinationCity}
                  onChange={(option) => {
                    setDestinationCity(option)
                    if (errors.destination_city) {
                      setErrors({ ...errors, destination_city: '' })
                    }
                  }}
                  onSearch={destinationCountry ? searchCities(destinationCountry.id) : async () => []}
                  disabled={!destinationCountry}
                  error={errors.destination_city}
                  helperText={!destinationCountry ? 'ابتدا کشور را انتخاب کنید' : undefined}
                  required
                />
              </div>

              {/* نوع کارت */}
              <Select
                label="نوع کارت"
                value={formData.is_sender ? 'sender' : 'traveler'}
                onChange={(e) => handleChange('is_sender', e.target.value === 'sender')}
                options={[
                  { value: 'traveler', label: 'مسافر (حمل بار)' },
                  { value: 'sender', label: 'فرستنده بار' },
                ]}
              />

              {/* تاریخ/بازه زمانی بر اساس نوع کارت */}
              {formData.is_sender ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DateTimePicker
                    label="شروع بازه زمانی"
                    value={formData.start_time_frame || ''}
                    onChange={(value) => handleChange('start_time_frame', value)}
                    includeTime={false}
                    helperText="اختیاری"
                  />
                  <DateTimePicker
                    label="پایان بازه زمانی"
                    value={formData.end_time_frame || ''}
                    onChange={(value) => handleChange('end_time_frame', value)}
                    includeTime={false}
                    validatePast={true}
                    helperText="اختیاری"
                  />
                </div>
              ) : (
                <DateTimePicker
                  label="تاریخ دقیق سفر"
                  value={formData.ticket_date_time || ''}
                  onChange={(value) => handleChange('ticket_date_time', value)}
                  includeTime={true}
                  validatePast={true}
                  helperText="اختیاری - تاریخ و ساعت مورد نظر برای سفر"
                />
              )}

              {/* وزن و قیمت */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="وزن (کیلوگرم)"
                  type="number"
                  step="0.1"
                  placeholder="مثال: 5.5"
                  value={formData.weight || ''}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  helperText="اختیاری"
                />
                <Input
                  label="قیمت پیشنهادی (درهم امارات)"
                  type="number"
                  step="0.01"
                  placeholder="مثال: 50"
                  value={formData.price_aed || ''}
                  onChange={(e) => handleChange('price_aed', e.target.value)}
                  helperText="اختیاری"
                />
              </div>

              {/* وضعیت بسته‌بندی */}
                <Select
                label="وضعیت بسته‌بندی"
                value={formData.is_packed === undefined ? '' : formData.is_packed ? 'true' : 'false'}
                onChange={(e) => handleChange('is_packed', e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined)}
                  options={[
                  { value: '', label: 'فرقی ندارد' },
                  { value: 'true', label: 'بسته‌بندی شده' },
                  { value: 'false', label: 'بدون بسته‌بندی' },
                  ]}
                />


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
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              isLoading={createCardMutation.isPending}
              className="w-full sm:w-auto"
            >
              ایجاد کارت
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

