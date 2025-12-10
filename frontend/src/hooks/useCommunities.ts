import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/lib/api'
import type { CommunityCreate, CommunityUpdate } from '@/types/community'

/**
 * Hook برای دریافت لیست کامیونیتی‌ها
 */
export function useCommunities(page: number = 1, page_size: number = 20) {
  return useQuery({
    queryKey: ['communities', page, page_size],
    queryFn: () => apiService.getCommunities(page, page_size),
  })
}

/**
 * Hook برای دریافت جزئیات یک کامیونیتی
 */
export function useCommunity(id: number) {
  return useQuery({
    queryKey: ['communities', id],
    queryFn: () => apiService.getCommunityById(id),
    enabled: !!id,
  })
}

/**
 * Hook برای دریافت کامیونیتی‌های من
 */
export function useMyCommunities() {
  return useQuery({
    queryKey: ['my-communities'],
    queryFn: () => apiService.getMyCommunities(),
  })
}

/**
 * Hook برای دریافت درخواست‌های عضویت من
 */
export function useMyJoinRequests() {
  return useQuery({
    queryKey: ['my-join-requests'],
    queryFn: () => apiService.getMyJoinRequests(),
  })
}

/**
 * Hook برای دریافت درخواست‌های عضویت کامیونیتی‌های من (به‌عنوان owner/manager)
 */
export function useManagedCommunityRequests() {
  return useQuery({
    queryKey: ['managed-community-requests'],
    queryFn: () => apiService.getManagedCommunityRequests(),
  })
}

/**
 * Hook برای لغو درخواست عضویت
 */
export function useCancelJoinRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (requestId: number) => apiService.cancelJoinRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-join-requests'] })
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })
}

/**
 * Hook برای دریافت اعضای کامیونیتی
 */
export function useCommunityMembers(communityId: number, page: number = 1, enabled: boolean = true) {
  return useQuery({
    queryKey: ['community-members', communityId, page],
    queryFn: () => apiService.getCommunityMembers(communityId, page),
    enabled: !!communityId && enabled,
  })
}

/**
 * Hook برای دریافت درخواست‌های عضویت
 */
export function useJoinRequests(communityId: number, page: number = 1, enabled: boolean = true) {
  return useQuery({
    queryKey: ['join-requests', communityId, page],
    queryFn: () => apiService.getJoinRequests(communityId, page),
    enabled: !!communityId && enabled,
  })
}

/**
 * Hook برای ایجاد کامیونیتی جدید
 */
export function useCreateCommunity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CommunityCreate) => apiService.createCommunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      queryClient.invalidateQueries({ queryKey: ['my-communities'] })
    },
  })
}

/**
 * Hook برای ویرایش کامیونیتی
 */
export function useUpdateCommunity(id: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CommunityUpdate) => apiService.updateCommunity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      queryClient.invalidateQueries({ queryKey: ['communities', id] })
    },
  })
}

/**
 * Hook برای درخواست عضویت
 */
export function useJoinCommunity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (communityId: number) => apiService.joinCommunityRequest(communityId),
    onSuccess: (_, communityId) => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      queryClient.invalidateQueries({ queryKey: ['communities', communityId] })
      queryClient.invalidateQueries({ queryKey: ['my-communities'] })
      queryClient.invalidateQueries({ queryKey: ['my-join-requests'] })
    },
  })
}

/**
 * Hook برای تایید درخواست عضویت
 */
export function useApproveJoinRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ communityId, requestId }: { communityId: number; requestId: number }) =>
      apiService.approveJoinRequest(communityId, requestId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', communityId] })
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] })
      queryClient.invalidateQueries({ queryKey: ['communities', communityId] })
      queryClient.invalidateQueries({ queryKey: ['my-join-requests'] })
      queryClient.invalidateQueries({ queryKey: ['managed-community-requests'] })
    },
  })
}

/**
 * Hook برای رد درخواست عضویت
 */
export function useRejectJoinRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ communityId, requestId }: { communityId: number; requestId: number }) =>
      apiService.rejectJoinRequest(communityId, requestId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', communityId] })
      queryClient.invalidateQueries({ queryKey: ['my-join-requests'] })
      queryClient.invalidateQueries({ queryKey: ['managed-community-requests'] })
    },
  })
}

/**
 * Hook برای حذف عضو از کامیونیتی
 */
export function useRemoveCommunityMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ communityId, userId }: { communityId: number; userId: number }) =>
      apiService.removeCommunityMember(communityId, userId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] })
      queryClient.invalidateQueries({ queryKey: ['communities', communityId] })
      queryClient.invalidateQueries({ queryKey: ['my-communities'] })
    },
  })
}

/**
 * Hook برای تغییر نقش عضو در کامیونیتی
 */
export function useChangeMemberRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ communityId, userId, role }: { communityId: number; userId: number; role: 'member' | 'manager' }) =>
      apiService.changeMemberRole(communityId, userId, role),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] })
      queryClient.invalidateQueries({ queryKey: ['communities', communityId] })
    },
  })
}

