import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/lib/api'
import type { MessageCreate } from '@/types/message'

/**
 * Hook برای دریافت لیست مکالمات
 */
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiService.getConversations(),
  })
}

/**
 * Hook برای دریافت پیام‌ها با یک کاربر
 */
export function useMessages(userId: number, page: number = 1) {
  return useQuery({
    queryKey: ['messages', userId, page],
    queryFn: () => apiService.getMessages(userId, page),
    enabled: !!userId,
  })
}

/**
 * Hook برای ارسال پیام
 */
export function useSendMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: MessageCreate) => apiService.sendMessage(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.receiver_id] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Hook برای علامت‌گذاری پیام به عنوان خوانده شده
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (messageId: number) => apiService.markMessageAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

