'use client'

import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import Card from '../Card'
import Badge from '../Badge'
import type { Card as CardType } from '@/types/card'
import { getCurrencyByCode } from '@/utils/currency'

/**
 * CardItem - Card display in list
 */
export default function CardItem(card: CardType) {
  const { t, formatDate, formatNumber, language } = useTranslation()
  
  const {
    id,
    origin_city,
    destination_city,
    ticket_date_time,
    start_time_frame,
    end_time_frame,
    weight,
    price_aed,
    currency,
    is_sender,
    product_classification,
    is_packed,
    description,
    owner,
  } = card

  // Calculate travel date
  const travelDate = ticket_date_time || start_time_frame
  
  // Get currency name based on language
  const getCurrencyName = (code: string | undefined) => {
    const currencyInfo = getCurrencyByCode(code || 'USD')
    if (!currencyInfo) return code || 'USD'
    
    switch (language) {
      case 'fa':
        return currencyInfo.nameFa
      case 'ar':
        return currencyInfo.nameAr || currencyInfo.name
      default:
        return currencyInfo.name
    }
  }
  
  return (
    <Link href={`/cards/${id}`}>
      <Card variant="bordered" className="p-6 hover:shadow-medium transition-shadow cursor-pointer h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              {origin_city.name} → {destination_city.name}
            </h3>
            <p className="text-sm text-neutral-600 font-light">
              {owner.first_name && owner.last_name
                ? `${owner.first_name} ${owner.last_name}`
                : t('common.user')}
            </p>
          </div>
          <Badge variant={is_sender ? "warning" : "info"} size="sm">
            {is_sender ? t('cards.detail.type.sender') : t('cards.detail.type.traveler')}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          {travelDate && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-neutral-700">{formatDate(travelDate)}</span>
            </div>
          )}
          
          {weight && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-neutral-700">{formatNumber(weight)} {t('cards.detail.kg')}</span>
            </div>
          )}

          {price_aed && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-neutral-700 font-medium">
                {formatNumber(price_aed)} {getCurrencyName(currency)}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-neutral-600 font-light line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex gap-2">
          {product_classification && (
            <Badge variant="neutral" size="sm">
              {product_classification.name}
            </Badge>
          )}
          {is_packed === true && (
            <Badge variant="success" size="sm">
              {t('cards.detail.packed')}
            </Badge>
          )}
          {is_packed === false && (
            <Badge variant="warning" size="sm">
              {t('cards.detail.unpacked')}
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  )
}
