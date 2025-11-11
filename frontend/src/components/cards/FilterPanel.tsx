'use client'

import { useState } from 'react'
import Input from '../Input'
import Select from '../Select'
import Button from '../Button'

interface FilterPanelProps {
  onFilterChange: (filters: any) => void
}

/**
 * FilterPanel - پنل فیلتر کارت‌ها
 */
export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
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
        <h3 className="text-lg font-bold text-neutral-900">فیلترها</h3>
        <button
          onClick={handleReset}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          پاک کردن
        </button>
      </div>

      <div className="space-y-4">
        {/* مبدأ و مقصد */}
        <Input
          label="مبدأ"
          placeholder="شهر مبدأ"
          value={filters.origin}
          onChange={(e) => handleChange('origin', e.target.value)}
        />

        <Input
          label="مقصد"
          placeholder="شهر مقصد"
          value={filters.destination}
          onChange={(e) => handleChange('destination', e.target.value)}
        />

        {/* تاریخ */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">بازه تاریخ</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              placeholder="از تاریخ"
              value={filters.date_from}
              onChange={(e) => handleChange('date_from', e.target.value)}
            />
            <Input
              type="date"
              placeholder="تا تاریخ"
              value={filters.date_to}
              onChange={(e) => handleChange('date_to', e.target.value)}
            />
          </div>
        </div>

        {/* ظرفیت */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">ظرفیت (کیلوگرم)</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="حداقل"
              value={filters.min_capacity_kg}
              onChange={(e) => handleChange('min_capacity_kg', e.target.value)}
            />
            <Input
              type="number"
              placeholder="حداکثر"
              value={filters.max_capacity_kg}
              onChange={(e) => handleChange('max_capacity_kg', e.target.value)}
            />
          </div>
        </div>

        {/* دسته‌بندی */}
        <Select
          label="دسته‌بندی کالا"
          value={filters.category}
          onChange={(e) => handleChange('category', e.target.value)}
          options={[
            { value: '', label: 'همه' },
            { value: 'پوشاک', label: 'پوشاک' },
            { value: 'خوراکی', label: 'خوراکی' },
            { value: 'الکترونیک', label: 'الکترونیک' },
            { value: 'لوازم خانگی', label: 'لوازم خانگی' },
            { value: 'سایر', label: 'سایر' },
          ]}
        />

        {/* وضعیت بسته‌بندی */}
        <Select
          label="وضعیت بسته‌بندی"
          value={filters.packaging_status}
          onChange={(e) => handleChange('packaging_status', e.target.value)}
          options={[
            { value: '', label: 'همه' },
            { value: 'بسته‌بندی شده', label: 'بسته‌بندی شده' },
            { value: 'بدون بسته‌بندی', label: 'بدون بسته‌بندی' },
          ]}
        />
      </div>
    </div>
  )
}

