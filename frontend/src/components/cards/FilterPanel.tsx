'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import Input from '../Input'
import Select from '../Select'
import Button from '../Button'

interface FilterPanelProps {
  onFilterChange: (filters: any) => void
}

/**
 * FilterPanel - Cards filter panel
 */
export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    date_from: '',
    date_to: '',
    min_capacity_kg: '',
    max_capacity_kg: '',
    category: '',
    packaging_status: '',
  })

  const handleChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const emptyFilters = {
      origin: '',
      destination: '',
      date_from: '',
      date_to: '',
      min_capacity_kg: '',
      max_capacity_kg: '',
      category: '',
      packaging_status: '',
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-neutral-900">{t('cards.filters.title')}</h3>
        <button
          onClick={handleReset}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {t('cards.filters.clear')}
        </button>
      </div>

      <div className="space-y-4">
        {/* Origin and Destination */}
        <Input
          label={t('cards.filters.origin')}
          placeholder={t('cards.filters.originPlaceholder')}
          value={filters.origin}
          onChange={(e) => handleChange('origin', e.target.value)}
        />

        <Input
          label={t('cards.filters.destination')}
          placeholder={t('cards.filters.destinationPlaceholder')}
          value={filters.destination}
          onChange={(e) => handleChange('destination', e.target.value)}
        />

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {t('cards.filters.dateRange')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              placeholder={t('cards.filters.fromDate')}
              value={filters.date_from}
              onChange={(e) => handleChange('date_from', e.target.value)}
            />
            <Input
              type="date"
              placeholder={t('cards.filters.toDate')}
              value={filters.date_to}
              onChange={(e) => handleChange('date_to', e.target.value)}
            />
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {t('cards.filters.capacity')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder={t('cards.filters.minCapacity')}
              value={filters.min_capacity_kg}
              onChange={(e) => handleChange('min_capacity_kg', e.target.value)}
            />
            <Input
              type="number"
              placeholder={t('cards.filters.maxCapacity')}
              value={filters.max_capacity_kg}
              onChange={(e) => handleChange('max_capacity_kg', e.target.value)}
            />
          </div>
        </div>

        {/* Category */}
        <Select
          label={t('cards.filters.category')}
          value={filters.category}
          onChange={(e) => handleChange('category', e.target.value)}
          options={[
            { value: '', label: t('cards.filters.categories.all') },
            { value: 'پوشاک', label: t('cards.filters.categories.clothing') },
            { value: 'خوراکی', label: t('cards.filters.categories.food') },
            { value: 'الکترونیک', label: t('cards.filters.categories.electronics') },
            { value: 'لوازم خانگی', label: t('cards.filters.categories.household') },
            { value: 'سایر', label: t('cards.filters.categories.other') },
          ]}
        />

        {/* Packaging Status */}
        <Select
          label={t('cards.filters.packagingStatus')}
          value={filters.packaging_status}
          onChange={(e) => handleChange('packaging_status', e.target.value)}
          options={[
            { value: '', label: t('cards.filters.packaging.all') },
            { value: 'بسته‌بندی شده', label: t('cards.filters.packaging.packed') },
            { value: 'بدون بسته‌بندی', label: t('cards.filters.packaging.unpacked') },
          ]}
        />
      </div>
    </div>
  )
}
