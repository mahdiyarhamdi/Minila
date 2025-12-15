'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/lib/api'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { PriceSuggestion, PriceSuggestionParams } from '@/types/card'

interface PriceSuggestionWidgetProps {
  originCityId?: number
  destinationCityId?: number
  travelDate?: string
  weight?: number
  categoryId?: number
  onPriceSelect: (price: number | null) => void
  className?: string
}

export function PriceSuggestionWidget({
  originCityId,
  destinationCityId,
  travelDate,
  weight,
  categoryId,
  onPriceSelect,
  className
}: PriceSuggestionWidgetProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  const enabled = !!(originCityId && destinationCityId)

  const { data: suggestion, isLoading, error } = useQuery<PriceSuggestion>({
    queryKey: ['price-suggestion', originCityId, destinationCityId, travelDate, weight, categoryId],
    queryFn: () => apiService.getPriceSuggestion({
      origin_city_id: originCityId!,
      destination_city_id: destinationCityId!,
      travel_date: travelDate,
      weight,
      category_id: categoryId
    }),
    enabled,
    staleTime: 30000, // Cache for 30 seconds
  })

  if (!enabled) {
    return null
  }

  if (isLoading) {
    return (
      <div className={cn("bg-gradient-to-r from-primary-50 to-sand-50 rounded-xl p-4 border border-primary-100", className)}>
        <div className="flex items-center gap-3">
          <div className="animate-pulse">
            <div className="w-5 h-5 bg-primary-200 rounded-full"></div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-primary-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-6 bg-primary-200 rounded w-1/4 animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !suggestion) {
    return null
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {t('cards.price.confidenceHigh')}
          </span>
        )
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {t('cards.price.confidenceMedium')}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
            {t('cards.price.confidenceLow')}
          </span>
        )
    }
  }

  const getFactorColor = (factor: number) => {
    if (factor > 1) return 'text-red-600'
    if (factor < 1) return 'text-green-600'
    return 'text-neutral-600'
  }

  return (
    <div className={cn("bg-gradient-to-r from-primary-50 to-sand-50 rounded-xl p-4 border border-primary-100", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="font-medium text-neutral-800">{t('cards.price.suggestedPrice')}</span>
        {getConfidenceBadge(suggestion.confidence)}
      </div>

      {/* Main Price */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-primary-700">
          ${suggestion.suggested_price_per_kg.toFixed(2)}
        </span>
        <span className="text-sm text-neutral-600">/{t('cards.price.perKg')}</span>
      </div>

      {/* Price Range */}
      <div className="text-sm text-neutral-600 mb-3">
        {t('cards.price.range')}: ${suggestion.min_price.toFixed(2)} - ${suggestion.max_price.toFixed(2)}
      </div>

      {/* Total Price (if weight provided) */}
      {weight && weight > 0 && (
        <div className="text-sm text-primary-700 font-medium mb-3 bg-white/50 rounded-lg px-3 py-2">
          {t('cards.price.totalEstimate')}: ${(suggestion.suggested_price_per_kg * weight).toFixed(2)} ({weight}kg)
        </div>
      )}

      {/* Message */}
      {suggestion.message && (
        <p className="text-xs text-neutral-600 mb-3">{suggestion.message}</p>
      )}

      {/* Breakdown Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mb-3"
      >
        <svg 
          className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {isExpanded ? t('cards.price.hideBreakdown') : t('cards.price.showBreakdown')}
      </button>

      {/* Breakdown */}
      {isExpanded && (
        <div className="bg-white/50 rounded-lg p-3 mb-3 space-y-2">
          {suggestion.breakdown.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-neutral-700">{item.label}</span>
              <span className={cn("font-medium", getFactorColor(item.factor))}>
                ×{item.factor.toFixed(2)}
              </span>
            </div>
          ))}
          
          {/* Factors Summary */}
          <div className="border-t border-neutral-200 pt-2 mt-2">
            <div className="text-xs text-neutral-500 space-y-1">
              {suggestion.factors.season !== 1 && (
                <div className="flex justify-between">
                  <span>{t('cards.price.factors.season')}</span>
                  <span className={getFactorColor(suggestion.factors.season)}>
                    {suggestion.factors.season > 1 ? '+' : ''}{((suggestion.factors.season - 1) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {suggestion.factors.demand !== 1 && suggestion.factors.demand !== 1.5 && (
                <div className="flex justify-between">
                  <span>{t('cards.price.factors.demand')}</span>
                  <span className={getFactorColor(suggestion.factors.demand)}>
                    {suggestion.factors.demand > 1 ? '+' : ''}{((suggestion.factors.demand - 1) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {suggestion.factors.urgency !== 1 && (
                <div className="flex justify-between">
                  <span>{t('cards.price.factors.urgency')}</span>
                  <span className={getFactorColor(suggestion.factors.urgency)}>
                    {suggestion.factors.urgency > 1 ? '+' : ''}{((suggestion.factors.urgency - 1) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPriceSelect(suggestion.suggested_price_per_kg)}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm"
        >
          {t('cards.price.useThisPrice')}
        </button>
        <button
          type="button"
          onClick={() => onPriceSelect(null)}
          className="px-4 py-2 bg-white text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors border border-neutral-200 text-sm"
        >
          {t('cards.price.enterCustom')}
        </button>
      </div>
    </div>
  )
}

