import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/lib/api'
import type { CardFilter, CardCreate, CardUpdate } from '@/types/card'

/**
 * Hook برای دریافت لیست کارت‌ها
 */
export function useCards(filters?: CardFilter) {
  return useQuery({
    queryKey: ['cards', filters],
    queryFn: () => apiService.getCards(filters),
  })
}

/**
 * Hook برای دریافت جزئیات یک کارت
 */
export function useCard(id: number) {
  return useQuery({
    queryKey: ['cards', id],
    queryFn: () => apiService.getCardById(id),
    enabled: !!id,
  })
}

/**
 * Hook برای دریافت کارت‌های خودم
 */
export function useMyCards() {
  return useQuery({
    queryKey: ['my-cards'],
    queryFn: () => apiService.getMyCards(),
  })
}

/**
 * Hook برای ایجاد کارت جدید
 */
export function useCreateCard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CardCreate) => apiService.createCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['my-cards'] })
    },
  })
}

/**
 * Hook برای ویرایش کارت
 */
export function useUpdateCard(id: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CardUpdate) => apiService.updateCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['cards', id] })
      queryClient.invalidateQueries({ queryKey: ['my-cards'] })
    },
  })
}

/**
 * Hook برای حذف کارت
 */
export function useDeleteCard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['my-cards'] })
    },
  })
}

