/**
 * تایپ‌های مربوط به پیام‌رسانی
 */

export interface Message {
  id: number
  sender_id: number
  sender: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  receiver_id: number
  receiver: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface MessageCreate {
  receiver_id: number
  content: string
  card_id?: number
}

export interface MessageListResponse {
  items: Message[]
  total: number
  page: number
  page_size: number
}

export interface Conversation {
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  last_message: {
    content: string
    created_at: string
    is_read: boolean
  }
  unread_count: number
}

export interface ConversationListResponse {
  items: Conversation[]
  total: number
}

