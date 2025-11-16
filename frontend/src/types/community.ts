/**
 * تایپ‌های مربوط به کامیونیتی‌ها
 */

export interface Community {
  id: number
  name: string
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
  created_at: string
  updated_at: string
}

export interface CommunityCreate {
  name: string
  bio?: string
  avatar_id?: number
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
  user_id: number
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  role: 'member' | 'manager' | 'moderator'
  joined_at: string
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
  status: 'pending' | 'approved' | 'rejected'
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

