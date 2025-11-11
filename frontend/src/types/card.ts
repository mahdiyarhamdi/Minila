/**
 * تایپ‌های مربوط به کارت‌ها
 */

export interface Card {
  id: number
  origin: string
  destination: string
  travel_date?: string
  capacity_kg?: number
  price?: number
  category: string
  packaging_status: string
  description?: string
  owner_id: number
  owner: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  communities?: Community[]
  created_at: string
  updated_at: string
}

export interface CardCreate {
  origin: string
  destination: string
  travel_date?: string
  capacity_kg?: number
  price?: number
  category: string
  packaging_status: string
  description?: string
  community_ids?: number[]
}

export interface CardUpdate {
  origin?: string
  destination?: string
  travel_date?: string
  capacity_kg?: number
  price?: number
  category?: string
  packaging_status?: string
  description?: string
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

