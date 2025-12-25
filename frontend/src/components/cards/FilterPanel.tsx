'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { cn, convertToEnglishNumbers } from '@/lib/utils'
import { apiService } from '@/lib/api'
import Select from '../Select'
import Button from '../Button'
import BottomSheet from '../BottomSheet'
import FilterChip from './FilterChip'
import Autocomplete, { AutocompleteOption } from '../Autocomplete'
import DateTimePicker from '../DateTimePicker'
import type { CardFilter } from '@/types/card'
import type { Country, City } from '@/types/location'
import { getCommonCurrencyOptions, type SupportedLanguage } from '@/utils/currency'

// Filter number input - uses local state and only syncs on blur to avoid keyboard closing
function FilterNumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync from parent when value changes externally (e.g., reset)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const converted = convertToEnglishNumbers(e.target.value)
    setLocalValue(converted)
  }

  const handleBlur = () => {
    // Only update parent on blur
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn(
        'w-full px-4 py-2.5 rounded-xl border transition-all',
        'text-neutral-900 placeholder:text-neutral-400',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        'border-neutral-200 focus:border-primary-500 focus:ring-primary-100'
      )}
    />
  )
}

interface FilterPanelProps {
  onFilterChange: (filters: CardFilter) => void
  initialFilters?: CardFilter
}

interface FilterState {
  originCountry: AutocompleteOption | null
  originCity: AutocompleteOption | null
  destinationCountry: AutocompleteOption | null
  destinationCity: AutocompleteOption | null
  date_from: string
  date_to: string
  min_weight: string
  max_weight: string
  min_price: string
  max_price: string
  currency: string
  is_packed: string
}

const initialState: FilterState = {
  originCountry: null,
  originCity: null,
  destinationCountry: null,
  destinationCity: null,
  date_from: '',
  date_to: '',
  min_weight: '',
  max_weight: '',
  min_price: '',
  max_price: '',
  currency: 'USD',
  is_packed: '',
}


/**
 * FilterPanel - پنل فیلتر کارت‌ها با پشتیبانی از موبایل و دسکتاپ
 * فقط با زدن دکمه اعمال فیلتر عمل می‌کند
 */
export default function FilterPanel({ onFilterChange, initialFilters }: FilterPanelProps) {
  const { t, language } = useTranslation()
  
  // Currency options based on current language
  const currencyOptions = getCommonCurrencyOptions(language as SupportedLanguage)
  // فیلترهای اعمال شده (نهایی)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialState)
  // فیلترهای در حال ویرایش (موقت)
  const [tempFilters, setTempFilters] = useState<FilterState>(initialState)
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  
  // Ref to track internal filter changes - prevents useEffect from wiping location labels
  // when parent re-renders with CardFilter (which only has IDs, not labels)
  const isInternalFilterChange = useRef(false)

  // Initialize filters from props - only for external changes (e.g., initial mount)
  useEffect(() => {
    // Skip if this is a change we initiated internally (preserves location labels)
    if (isInternalFilterChange.current) {
      isInternalFilterChange.current = false
      return
    }
    
    if (initialFilters) {
      const newState: FilterState = {
        ...initialState,
        date_from: initialFilters.date_from || '',
        date_to: initialFilters.date_to || '',
        min_weight: initialFilters.min_weight?.toString() || '',
        max_weight: initialFilters.max_weight?.toString() || '',
        min_price: initialFilters.min_price?.toString() || '',
        max_price: initialFilters.max_price?.toString() || '',
        currency: initialFilters.currency || 'USD',
        is_packed: initialFilters.is_packed === undefined ? '' : initialFilters.is_packed ? 'true' : 'false',
      }
      setAppliedFilters(newState)
      setTempFilters(newState)
    }
  }, [initialFilters])

  // Count active filters - calculated on every render for reliability
  const getActiveFilterCount = () => {
    let count = 0
    if (appliedFilters.originCity || appliedFilters.originCountry) count++
    if (appliedFilters.destinationCity || appliedFilters.destinationCountry) count++
    if (appliedFilters.date_from) count++
    if (appliedFilters.date_to) count++
    if (appliedFilters.min_weight) count++
    if (appliedFilters.max_weight) count++
    if (appliedFilters.min_price || appliedFilters.max_price) count++
    if (appliedFilters.is_packed) count++
    return count
  }
  const activeFilterCount = getActiveFilterCount()

  // Get active filters as array for chips - calculated on every render for reliability
  const getActiveFiltersArray = (): Array<{ key: string; label: string; value: string }> => {
    const result: Array<{ key: string; label: string; value: string }> = []

    // مبدأ: اگر شهر انتخاب شده، شهر را نشان بده؛ اگر نه، کشور را نشان بده
    if (appliedFilters.originCity && appliedFilters.originCity.label) {
      result.push({ key: 'origin', label: t('cards.filters.origin'), value: appliedFilters.originCity.label })
    } else if (appliedFilters.originCountry && appliedFilters.originCountry.label) {
      result.push({ key: 'origin', label: t('cards.filters.origin'), value: appliedFilters.originCountry.label })
    }
    
    // مقصد: اگر شهر انتخاب شده، شهر را نشان بده؛ اگر نه، کشور را نشان بده
    if (appliedFilters.destinationCity && appliedFilters.destinationCity.label) {
      result.push({ key: 'destination', label: t('cards.filters.destination'), value: appliedFilters.destinationCity.label })
    } else if (appliedFilters.destinationCountry && appliedFilters.destinationCountry.label) {
      result.push({ key: 'destination', label: t('cards.filters.destination'), value: appliedFilters.destinationCountry.label })
    }
    
    if (appliedFilters.date_from) {
      const date = new Date(appliedFilters.date_from)
      result.push({ key: 'date_from', label: t('cards.filters.fromDate'), value: date.toLocaleDateString(language === 'fa' ? 'fa-IR' : language === 'ar' ? 'ar-SA' : 'en-US') })
    }
    if (appliedFilters.date_to) {
      const date = new Date(appliedFilters.date_to)
      result.push({ key: 'date_to', label: t('cards.filters.toDate'), value: date.toLocaleDateString(language === 'fa' ? 'fa-IR' : language === 'ar' ? 'ar-SA' : 'en-US') })
    }
    if (appliedFilters.min_weight) {
      result.push({
        key: 'min_weight',
        label: t('cards.filters.minWeight'),
        value: `${appliedFilters.min_weight} kg`,
      })
    }
    if (appliedFilters.max_weight) {
      result.push({
        key: 'max_weight',
        label: t('cards.filters.maxWeight'),
        value: `${appliedFilters.max_weight} kg`,
      })
    }
    if (appliedFilters.min_price || appliedFilters.max_price) {
      const priceRange = []
      if (appliedFilters.min_price) priceRange.push(appliedFilters.min_price)
      priceRange.push('-')
      if (appliedFilters.max_price) priceRange.push(appliedFilters.max_price)
      result.push({
        key: 'price',
        label: t('cards.filters.priceRange'),
        value: `${priceRange.join(' ')} ${appliedFilters.currency}`,
      })
    }
    if (appliedFilters.is_packed) {
      result.push({
        key: 'is_packed',
        label: t('cards.filters.packagingStatus'),
        value: appliedFilters.is_packed === 'true' ? t('cards.filters.packaging.packed') : t('cards.filters.packaging.unpacked'),
      })
    }

    return result
  }
  const activeFiltersArray = getActiveFiltersArray()

  // Convert FilterState to CardFilter
  const convertToCardFilter = useCallback((state: FilterState): CardFilter => {
    return {
      // اگر شهر انتخاب شده، فقط شهر را بفرست؛ اگر نه، کشور را بفرست
      origin_country_id: state.originCity ? undefined : state.originCountry?.id,
      origin_city_id: state.originCity?.id,
      destination_country_id: state.destinationCity ? undefined : state.destinationCountry?.id,
      destination_city_id: state.destinationCity?.id,
      date_from: state.date_from || undefined,
      date_to: state.date_to || undefined,
      min_weight: state.min_weight ? Number(state.min_weight) : undefined,
      max_weight: state.max_weight ? Number(state.max_weight) : undefined,
      min_price: state.min_price ? Number(state.min_price) : undefined,
      max_price: state.max_price ? Number(state.max_price) : undefined,
      currency: state.currency !== 'USD' || state.min_price || state.max_price ? state.currency : undefined,
      is_packed: state.is_packed === '' ? undefined : state.is_packed === 'true',
    }
  }, [])

  // Country search function
  const searchCountries = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const result = await apiService.searchCountries(query, 10)
      return result.items.map((country: Country) => ({
        id: country.id,
        label: country.name_en,
        value: String(country.id),
        isoCode: country.iso_code,
      }))
    } catch (error) {
      console.error('Error searching countries:', error)
      return []
    }
  }, [])

  // City search function (requires country)
  const searchCities = useCallback((countryId: number) => async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const result = await apiService.searchCities(countryId, query, 10)
      return result.items.map((city: City) => ({
        id: city.id,
        label: `${city.name_en} (${city.airport_code || ''})`,
        value: String(city.id),
      }))
    } catch (error) {
      console.error('Error searching cities:', error)
      return []
    }
  }, [])

  // Handle temp filter change
  const handleTempChange = useCallback(
    <K extends keyof FilterState>(field: K, value: FilterState[K]) => {
      setTempFilters((prev) => {
        const newFilters = { ...prev, [field]: value }
        // Reset city when country changes
        if (field === 'originCountry') {
          newFilters.originCity = null
        }
        if (field === 'destinationCountry') {
          newFilters.destinationCity = null
        }
        return newFilters
      })
    },
    []
  )

  // Remove single filter
  const handleRemoveFilter = useCallback(
    (key: string) => {
      let newFilters: FilterState = { ...appliedFilters }
      
      if (key === 'origin') {
        newFilters.originCountry = null
        newFilters.originCity = null
      } else if (key === 'destination') {
        newFilters.destinationCountry = null
        newFilters.destinationCity = null
      } else if (key === 'price') {
        newFilters.min_price = ''
        newFilters.max_price = ''
      } else if (key === 'date_from') {
        newFilters.date_from = ''
      } else if (key === 'date_to') {
        newFilters.date_to = ''
      } else if (key === 'min_weight') {
        newFilters.min_weight = ''
      } else if (key === 'max_weight') {
        newFilters.max_weight = ''
      } else if (key === 'is_packed') {
        newFilters.is_packed = ''
      }
      
      setAppliedFilters(newFilters)
      setTempFilters(newFilters)
      // Mark as internal change to prevent useEffect from resetting location labels
      isInternalFilterChange.current = true
      onFilterChange(convertToCardFilter(newFilters))
    },
    [appliedFilters, onFilterChange, convertToCardFilter]
  )

  // Reset all filters
  const handleReset = useCallback(() => {
    setAppliedFilters(initialState)
    setTempFilters(initialState)
    // Mark as internal change to prevent useEffect from running
    isInternalFilterChange.current = true
    onFilterChange({})
    setIsBottomSheetOpen(false)
  }, [onFilterChange])

  // Apply filters - use latest tempFilters directly to avoid stale closure
  const handleApplyFilters = () => {
    // Create a deep copy to ensure React detects the change
    const newFilters: FilterState = {
      originCountry: tempFilters.originCountry ? { ...tempFilters.originCountry } : null,
      originCity: tempFilters.originCity ? { ...tempFilters.originCity } : null,
      destinationCountry: tempFilters.destinationCountry ? { ...tempFilters.destinationCountry } : null,
      destinationCity: tempFilters.destinationCity ? { ...tempFilters.destinationCity } : null,
      date_from: tempFilters.date_from,
      date_to: tempFilters.date_to,
      min_weight: tempFilters.min_weight,
      max_weight: tempFilters.max_weight,
      min_price: tempFilters.min_price,
      max_price: tempFilters.max_price,
      currency: tempFilters.currency,
      is_packed: tempFilters.is_packed,
    }
    // Set applied filters first
    setAppliedFilters(newFilters)
    // Mark as internal change to prevent useEffect from wiping location labels
    isInternalFilterChange.current = true
    // Then notify parent
    onFilterChange(convertToCardFilter(newFilters))
    // Finally close the sheet
    setIsBottomSheetOpen(false)
  }

  // Cancel - clear all filters and show all results
  const handleCancel = useCallback(() => {
    setAppliedFilters(initialState)
    setTempFilters(initialState)
    // Mark as internal change to prevent useEffect from running
    isInternalFilterChange.current = true
    onFilterChange({})
    setIsBottomSheetOpen(false)
  }, [onFilterChange])

  // Open bottom sheet
  const openBottomSheet = useCallback(() => {
    setTempFilters(appliedFilters)
    setIsBottomSheetOpen(true)
  }, [appliedFilters])

  // Packaging options
  const packagingOptions = [
    { value: '', label: t('cards.filters.packaging.all') },
    { value: 'true', label: t('cards.filters.packaging.packed') },
    { value: 'false', label: t('cards.filters.packaging.unpacked') },
  ]

  // Filter form content (shared between desktop and mobile)
  const FilterFormContent = ({
    currentFilters,
    onChange,
  }: {
    currentFilters: FilterState
    onChange: <K extends keyof FilterState>(field: K, value: FilterState[K]) => void
  }) => (
    <div className="space-y-5">
      {/* Origin: Country + City */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-neutral-700">
          {t('cards.filters.origin')}
        </label>
        <Autocomplete
          label={t('cards.new.originCountry')}
          placeholder={t('cards.new.searchCountry')}
          value={currentFilters.originCountry}
          onChange={(option) => onChange('originCountry', option)}
          onSearch={searchCountries}
        />
        <Autocomplete
          label={t('cards.new.originCity')}
          placeholder={t('cards.new.searchCity')}
          value={currentFilters.originCity}
          onChange={(option) => onChange('originCity', option)}
          onSearch={currentFilters.originCountry ? searchCities(currentFilters.originCountry.id) : async () => []}
          disabled={!currentFilters.originCountry}
          helperText={!currentFilters.originCountry ? t('cards.new.selectCountryFirst') : undefined}
        />
      </div>

      {/* Destination: Country + City */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-neutral-700">
          {t('cards.filters.destination')}
        </label>
        <Autocomplete
          label={t('cards.new.destinationCountry')}
          placeholder={t('cards.new.searchCountry')}
          value={currentFilters.destinationCountry}
          onChange={(option) => onChange('destinationCountry', option)}
          onSearch={searchCountries}
        />
        <Autocomplete
          label={t('cards.new.destinationCity')}
          placeholder={t('cards.new.searchCity')}
          value={currentFilters.destinationCity}
          onChange={(option) => onChange('destinationCity', option)}
          onSearch={currentFilters.destinationCountry ? searchCities(currentFilters.destinationCountry.id) : async () => []}
          disabled={!currentFilters.destinationCountry}
          helperText={!currentFilters.destinationCountry ? t('cards.new.selectCountryFirst') : undefined}
        />
      </div>

      {/* Date Range - Stacked vertically */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-neutral-700">
            {t('cards.filters.dateRange')}
          </label>
        <DateTimePicker
          label={t('cards.filters.fromDate')}
          value={currentFilters.date_from}
          onChange={(value) => onChange('date_from', value)}
          includeTime={false}
        />
        <DateTimePicker
          label={t('cards.filters.toDate')}
          value={currentFilters.date_to}
          onChange={(value) => onChange('date_to', value)}
          includeTime={false}
        />
      </div>

      {/* Weight Range */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('cards.filters.weightRange')}
        </label>
        <div className="grid grid-cols-2 gap-3">
            <FilterNumberInput
              placeholder={t('cards.filters.minWeight')}
              value={currentFilters.min_weight}
              onChange={(value) => onChange('min_weight', value)}
            />
            <FilterNumberInput
              placeholder={t('cards.filters.maxWeight')}
              value={currentFilters.max_weight}
              onChange={(value) => onChange('max_weight', value)}
            />
          </div>
        </div>

      {/* Price Range */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-neutral-700">
          {t('cards.filters.priceRange')}
          </label>
        
        {/* Price Inputs */}
        <div className="grid grid-cols-2 gap-3">
            <FilterNumberInput
              placeholder={t('cards.filters.minPrice')}
              value={currentFilters.min_price}
              onChange={(value) => onChange('min_price', value)}
            />
            <FilterNumberInput
              placeholder={t('cards.filters.maxPrice')}
              value={currentFilters.max_price}
              onChange={(value) => onChange('max_price', value)}
            />
        </div>

        {/* Currency Select */}
        <Select
          label={t('cards.filters.currency')}
          value={currentFilters.currency}
          onChange={(e) => onChange('currency', e.target.value)}
          options={currencyOptions}
        />
      </div>

        {/* Packaging Status - Checkboxes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            {t('cards.filters.packagingStatus')}
          </label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentFilters.is_packed === 'true'}
                onChange={(e) => onChange('is_packed', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">{t('cards.filters.packaging.packed')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentFilters.is_packed === 'false'}
                onChange={(e) => onChange('is_packed', e.target.checked ? 'false' : '')}
                className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">{t('cards.filters.packaging.unpacked')}</span>
            </label>
          </div>
        </div>
    </div>
  )

  // Render active filter chips inline for reliability
  const renderActiveFilterChips = () => {
    if (activeFiltersArray.length === 0) return null
    
    return (
      <div className="flex flex-wrap gap-2">
        {activeFiltersArray.map((filter) => (
          <FilterChip
            key={filter.key}
            label={filter.label}
            value={filter.value}
            onRemove={() => handleRemoveFilter(filter.key)}
          />
        ))}
        {activeFiltersArray.length > 1 && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-600 text-sm font-medium hover:bg-neutral-200 transition-colors"
          >
            {t('cards.filters.clear')}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Desktop Sidebar Filter */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sticky top-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-neutral-900">{t('cards.filters.title')}</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={handleReset}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                {t('cards.filters.clear')}
              </button>
            )}
          </div>

          {/* Desktop Filter Chips */}
          {activeFiltersArray.length > 0 && (
            <div className="mb-5 pb-5 border-b border-neutral-200">
              {renderActiveFilterChips()}
            </div>
          )}

          <FilterFormContent currentFilters={tempFilters} onChange={handleTempChange} />

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-neutral-200 flex gap-3">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="flex-1"
            >
              {t('cards.filters.cancel')}
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1">
              {t('cards.filters.apply')}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Button & Chips */}
      <div className="lg:hidden">
        {/* Filter Button */}
        <button
          onClick={openBottomSheet}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-3 px-4',
            'bg-white rounded-xl border border-neutral-200',
            'text-neutral-700 font-medium transition-all',
            'hover:bg-neutral-50 hover:border-neutral-300',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span>{t('cards.filters.title')}</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-primary-600 text-white text-xs font-bold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Mobile Active Filter Chips */}
        {activeFiltersArray.length > 0 && (
          <div className="mt-3">
            {renderActiveFilterChips()}
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={handleCancel}
        title={t('cards.filters.title')}
        closeOnBackdropClick={false}
        closeOnSwipe={false}
      >
        <div className="p-4">
          {/* Reset button in header */}
          {activeFilterCount > 0 && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setTempFilters(initialState)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('cards.filters.clear')}
              </button>
            </div>
          )}

          <FilterFormContent currentFilters={tempFilters} onChange={handleTempChange} />

          {/* Action Buttons - با فاصله کافی از پایین برای جلوگیری از overlap با navbar */}
          <div className="mt-6 pt-4 pb-24 border-t border-neutral-200 flex gap-3">
            <Button variant="ghost" onClick={handleCancel} className="flex-1">
              {t('cards.filters.cancel')}
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1">
              {t('cards.filters.apply')}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
