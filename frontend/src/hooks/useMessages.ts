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
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })
}

/**
 * Hook برای علامت‌گذاری تمام پیام‌های یک مکالمه به عنوان خوانده شده
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId: number) => apiService.markConversationAsRead(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', userId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })
}

/**
 * Hook برای دریافت تعداد کل پیام‌های خوانده نشده
 */
export function useUnreadCount(enabled: boolean = true) {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: () => apiService.getUnreadMessagesCount(),
    refetchInterval: enabled ? 30000 : false, // هر 30 ثانیه یک بار refresh (فقط اگر enabled باشد)
    enabled, // فقط اگر کاربر لاگین باشد
    retry: false, // در صورت 401 دوباره تلاش نکن
    staleTime: 0, // همیشه fresh data بگیر
    refetchOnMount: true, // هر بار که component mount شد refetch کن
    refetchOnWindowFocus: true, // وقتی window focus شد refetch کن
  })
}

