import { QueryClient } from '@tanstack/react-query'

/**
 * QueryClient برای TanStack Query
 * 
 * staleTime: زمانی که داده تازه محسوب می‌شود (0 = همیشه stale)
 * gcTime: زمان نگهداری داده در cache بعد از unmount
 * refetchOnMount: آیا هنگام mount دوباره fetch شود
 * refetchOnWindowFocus: آیا هنگام focus روی window دوباره fetch شود
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // داده‌ها همیشه stale هستند و هنگام mount مجدداً fetch می‌شوند
      gcTime: 1000 * 60 * 10, // 10 دقیقه در cache نگه‌داری
      refetchOnMount: true, // هنگام mount کامپوننت refetch شود
      refetchOnWindowFocus: true, // هنگام برگشت به صفحه refetch شود
      retry: 1,
    },
  },
})

