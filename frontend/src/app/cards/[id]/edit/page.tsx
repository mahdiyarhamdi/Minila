'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCard, useUpdateCard } from '@/hooks/useCards'
import { useMyCommunities } from '@/hooks/useCommunities'
import { useAuth } from '@/contexts/AuthContext'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Textarea from '@/components/Textarea'
import Button from '@/components/Button'
import Autocomplete, { AutocompleteOption } from '@/components/Autocomplete'
import LoadingSpinner from '@/components/LoadingSpinner'
import DateTimePicker from '@/components/DateTimePicker'
// Toggle removed - using checkbox instead
import { useToast } from '@/components/Toast'
import { apiService } from '@/lib/api'
import { extractErrorMessage } from '@/utils/errors'
import { getCurrencyOptions } from '@/utils/currency'
import type { Country, City } from '@/types/location'
import type { CardUpdate } from '@/types/card'

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
  currency?: string
  description?: string
  product_classification_id?: number
  community_ids?: number[]
}

/**
 * صفحه ویرایش کارت
 */
export default function EditCardPage({ params }: { params: { id: string } }) {
  const cardId = parseInt(params.id)
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { data: card, isLoading: isLoadingCard, error: cardError } = useCard(cardId)
  const updateCardMutation = useUpdateCard(cardId)
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
    currency: 'USD',
    description: '',
    community_ids: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isInitialized, setIsInitialized] = useState(false)
  
  // برای مسافران: آیا تاریخ دقیق سفر مشخص نیست
  const [dateNotSpecified, setDateNotSpecified] = useState(false)

  // Initialize form with card data
  useEffect(() => {
    if (card && !isInitialized) {
      // Set location autocomplete options
      setOriginCountry({
        id: card.origin_country.id,
        label: card.origin_country.name,
        value: String(card.origin_country.id),
        isoCode: (card.origin_country as any).iso_code,
      })
      setOriginCity({
        id: card.origin_city.id,
        label: card.origin_city.name,
        value: String(card.origin_city.id),
      })
      setDestinationCountry({
        id: card.destination_country.id,
        label: card.destination_country.name,
        value: String(card.destination_country.id),
        isoCode: (card.destination_country as any).iso_code,
      })
      setDestinationCity({
        id: card.destination_city.id,
        label: card.destination_city.name,
        value: String(card.destination_city.id),
      })

      // Set form data
      setFormData({
        is_sender: card.is_sender,
        origin_country_id: card.origin_country.id,
        origin_city_id: card.origin_city.id,
        destination_country_id: card.destination_country.id,
        destination_city_id: card.destination_city.id,
        start_time_frame: card.start_time_frame || '',
        end_time_frame: card.end_time_frame || '',
        ticket_date_time: card.ticket_date_time || '',
        weight: card.weight,
        is_packed: card.is_packed,
        price_aed: card.price_aed,
        currency: card.currency || 'USD',
        description: card.description || '',
        product_classification_id: card.product_classification?.id,
        community_ids: card.communities?.map(c => c.id) || [],
      })

      // برای مسافر: اگر بازه زمانی دارد یعنی تاریخ دقیق مشخص نیست
      if (!card.is_sender) {
        const hasTimeRange = card.start_time_frame || card.end_time_frame
        setDateNotSpecified(!!hasTimeRange)
      }

      setIsInitialized(true)
    }
  }, [card, isInitialized])

  // Check ownership
  useEffect(() => {
    if (card && user && card.owner.id !== user.id) {
      showToast('error', 'شما مجاز به ویرایش این کارت نیستید')
      router.push(`/cards/${cardId}`)
    }
  }, [card, user, cardId, router, showToast])

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
        isoCode: country.iso_code,
      }))
    } catch (error) {
      console.error('Error searching countries:', error)
      return []
    }
  }, [])
  
  // گزینه‌های واحد پول بر اساس کشورهای مبدأ و مقصد (و ارز فعلی کارت)
  const currencyOptions = useMemo(() => {
    return getCurrencyOptions(
      originCountry?.isoCode as string | undefined, 
      destinationCountry?.isoCode as string | undefined, 
      formData.currency
    )
  }, [originCountry?.isoCode, destinationCountry?.isoCode, formData.currency])

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
      // Build update data - only include changed fields
      const updateData: CardUpdate = {
        is_sender: formData.is_sender,
        origin_country_id: originCountry!.id,
        origin_city_id: originCity!.id,
        destination_country_id: destinationCountry!.id,
        destination_city_id: destinationCity!.id,
      }

      // فیلدهای اختیاری - فقط فیلدهایی که تغییر کرده‌اند را ارسال کن
      if (formData.weight) {
        updateData.weight = Number(formData.weight)
      }
      // برای is_packed باید مقدار null هم قابل ارسال باشد
      updateData.is_packed = formData.is_packed === undefined ? null : formData.is_packed
      
      if (formData.price_aed) {
        updateData.price_aed = Number(formData.price_aed)
      }
      if (formData.currency) {
        updateData.currency = formData.currency
      }
      if (formData.description) {
        updateData.description = formData.description
      }
      if (formData.product_classification_id) {
        updateData.product_classification_id = formData.product_classification_id
      }
      if (formData.community_ids?.length) {
        updateData.community_ids = formData.community_ids
      }

      // Add time fields based on card type and date knowledge
      if (formData.is_sender) {
        // فرستنده بار - همیشه بازه زمانی
        if (formData.start_time_frame) {
          updateData.start_time_frame = formData.start_time_frame
        }
        if (formData.end_time_frame) {
          updateData.end_time_frame = formData.end_time_frame
        }
      } else {
        // مسافر - بسته به اینکه تاریخ دقیق مشخص است یا نه
        if (!dateNotSpecified) {
          // تاریخ دقیق مشخص است
          if (formData.ticket_date_time) {
            updateData.ticket_date_time = formData.ticket_date_time
          }
        } else {
          // تاریخ دقیق مشخص نیست - بازه زمانی
          if (formData.start_time_frame) {
            updateData.start_time_frame = formData.start_time_frame
          }
          if (formData.end_time_frame) {
            updateData.end_time_frame = formData.end_time_frame
          }
        }
      }

      await updateCardMutation.mutateAsync(updateData)
      showToast('success', 'کارت با موفقیت ویرایش شد')
      router.push(`/cards/${cardId}`)
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

  // Loading state
  if (isLoadingCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Error or not found
  if (cardError || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card variant="bordered" className="p-6 max-w-md">
          <p className="text-red-600 text-center">کارت یافت نشد</p>
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={() => router.push('/cards')}>
              بازگشت به لیست کارت‌ها
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
            ویرایش کارت
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-light">
            اطلاعات کارت خود را به‌روزرسانی کنید
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
                // فرستنده بار - همیشه بازه زمانی
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
                // مسافر - انتخاب بین تاریخ دقیق یا بازه
                <div className="space-y-4">
                  {/* چک‌باکس برای مشخص نبودن تاریخ دقیق */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={dateNotSpecified}
                      onChange={(e) => setDateNotSpecified(e.target.checked)}
                      className="w-5 h-5 text-primary-600 border-2 border-neutral-300 rounded 
                        focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                        checked:bg-primary-600 checked:border-primary-600
                        transition-colors cursor-pointer"
                    />
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
                      تاریخ دقیق سفرم مشخص نیست
                    </span>
                  </label>
                  
                  {!dateNotSpecified ? (
                    <DateTimePicker
                      label="تاریخ دقیق سفر"
                      value={formData.ticket_date_time || ''}
                      onChange={(value) => handleChange('ticket_date_time', value)}
                      includeTime={true}
                      validatePast={true}
                      helperText="اختیاری - تاریخ و ساعت مورد نظر برای سفر"
                    />
                  ) : (
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
                  )}
                </div>
              )}

              {/* وزن */}
              <Input
                label="وزن (کیلوگرم)"
                type="number"
                step="0.1"
                placeholder="مثال: 5.5"
                value={formData.weight || ''}
                onChange={(e) => handleChange('weight', e.target.value)}
                helperText="اختیاری"
              />
              
              {/* قیمت و واحد پول */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="قیمت پیشنهادی"
                    type="number"
                    step="0.01"
                    placeholder="مثال: 50"
                    value={formData.price_aed || ''}
                    onChange={(e) => handleChange('price_aed', e.target.value)}
                    helperText="اختیاری"
                  />
                </div>
                <Select
                  label="واحد پول"
                  value={formData.currency || 'USD'}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  options={currencyOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
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
              onClick={() => router.push(`/cards/${cardId}`)}
              className="w-full sm:w-auto"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              isLoading={updateCardMutation.isPending}
              className="w-full sm:w-auto"
            >
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

