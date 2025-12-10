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
  price_aed?: number
  currency?: string
  description?: string
  product_classification?: {
    id: number
    name: string
  }
  communities?: Community[]
  created_at: string
  
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
  price_aed?: number
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
  price_aed?: number
  currency?: string
  description?: string
  product_classification_id?: number
  community_ids?: number[]
}

export interface CardFilter {
  origin?: string
  destination?: string
  date_from?: string
  date_to?: string
  min_capacity_kg?: number
  max_capacity_kg?: number
  category?: string
  packaging_status?: string
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

