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
  body: string
  created_at: string
}

export interface MessageCreate {
  receiver_id: number
  body: string
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
    body: string
    created_at: string
  }
  unread_count: number
}

export interface ConversationListResponse {
  items: Conversation[]
  total: number
}

