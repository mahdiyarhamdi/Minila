/**
 * تایپ‌های مربوط به کارت‌ها
 */

export interface Card {
  id: number
  owner: {
    id: number
    first_name?: string
    last_name?: string
  }
  is_sender: boolean
  origin_country: {
    id: number
    name: string
  }
  origin_city: {
    id: number
    name: string
    country_id: number
  }
  destination_country: {
    id: number
    name: string
  }
  destination_city: {
    id: number
    name: string
    country_id: number
  }
  start_time_frame?: string
  end_time_frame?: string
  ticket_date_time?: string
  weight?: number
  is_packed?: boolean
  price_per_kg?: number
  price_aed?: number  // Legacy field
  is_legacy_price?: boolean
  total_price?: number  // Computed: price_per_kg × weight
  currency?: string
  description?: string
  product_classification?: {
    id: number
    name: string
  }
  communities?: Community[]
  created_at: string
  
  // Analytics (only returned for owner's cards)
  view_count?: number
  click_count?: number
  
  // Legacy fields for backward compatibility (computed)
  origin?: string
  destination?: string
  travel_date?: string
  capacity_kg?: number
  price?: number
  category?: string
  packaging_status?: string
}

export interface CardCreate {
  is_sender: boolean
  origin_country_id: number
  origin_city_id: number
  destination_country_id: number
  destination_city_id: number
  start_time_frame?: string
  end_time_frame?: string
  ticket_date_time?: string
  weight?: number
  is_packed?: boolean
  price_per_kg?: number
  price_aed?: number  // Legacy field
  currency?: string
  description?: string
  product_classification_id?: number
  community_ids?: number[]
}

export interface CardUpdate {
  is_sender?: boolean
  origin_country_id?: number
  origin_city_id?: number
  destination_country_id?: number
  destination_city_id?: number
  start_time_frame?: string
  end_time_frame?: string
  ticket_date_time?: string
  weight?: number
  is_packed?: boolean | null
  price_per_kg?: number
  price_aed?: number  // Legacy field
  currency?: string
  description?: string
  product_classification_id?: number
  community_ids?: number[]
}

export interface CardFilter {
  origin_country_id?: number
  origin_city_id?: number
  destination_country_id?: number
  destination_city_id?: number
  date_from?: string
  date_to?: string
  min_weight?: number
  max_weight?: number
  min_price_per_kg?: number
  max_price_per_kg?: number
  min_price?: number  // Legacy
  max_price?: number  // Legacy
  currency?: string
  is_packed?: boolean
  community_id?: number
  page?: number
  page_size?: number
}

export interface CardListResponse {
  items: Card[]
  total: number
  page: number
  page_size: number
}

interface Community {
  id: number
  name: string
}

// ========== Price Suggestion Types ==========

export interface PriceFactorBreakdown {
  label: string
  value: number
  factor: number
}

export interface PriceSuggestion {
  suggested_price_per_kg: number
  currency: string
  min_price: number
  max_price: number
  confidence: 'high' | 'medium' | 'low'
  base_ticket_price?: number
  source: string
  factors: {
    route: number
    season: number
    demand: number
    urgency: number
    weight: number
    category: number
  }
  breakdown: PriceFactorBreakdown[]
  message: string
}

export interface PriceSuggestionParams {
  origin_city_id: number
  destination_city_id: number
  travel_date?: string
  weight?: number
  category_id?: number
}

