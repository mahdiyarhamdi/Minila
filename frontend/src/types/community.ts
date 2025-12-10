/**
 * تایپ‌های مربوط به کامیونیتی‌ها
 */

export interface Community {
  id: number
  name: string
  slug: string
  bio?: string
  avatar?: {
    id: number
    url: string
    mime_type: string
  } | null
  owner: {
    id: number
    first_name: string
    last_name: string
  }
  member_count?: number
  is_member?: boolean
  my_role?: 'owner' | 'member' | 'manager' | 'moderator' | null
  has_pending_request?: boolean
  created_at: string
  updated_at: string
}

export interface CommunityCreate {
  name: string
  slug: string
  bio?: string
  avatar_id?: number
}

export interface SlugCheckResponse {
  slug: string
  available: boolean
  message: string
}

export interface CommunityUpdate {
  name?: string
  bio?: string
  avatar_id?: number
}

export interface CommunityListResponse {
  items: Community[]
  total: number
  page: number
  page_size: number
}

export interface Member {
  id: number
  user_id?: number
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  role: {
    id?: number
    name: 'owner' | 'member' | 'manager' | 'moderator'
  }
  is_active?: boolean
  joined_at?: string
  created_at?: string
}

export interface JoinRequest {
  id: number
  user_id: number
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  community_id: number
  community: {
    id: number
    name: string
    slug?: string
  }
  status: 'pending' | 'approved' | 'rejected'
  is_approved: boolean | null  // null = pending, true = approved, false = rejected
  created_at: string
  updated_at: string
}

export interface JoinRequestListResponse {
  items: JoinRequest[]
  total: number
  page: number
  page_size: number
}

export interface MemberListResponse {
  items: Member[]
  total: number
  page: number
  page_size: number
}

