'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/lib/api'
import Card from '@/components/Card'
import Button from '@/components/Button'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'

/**
 * صفحه بلاک لیست
 */
export default function BlockedUsersPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [unblockUserId, setUnblockUserId] = useState<number | null>(null)

  const { data: blockedUsers, isLoading } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => apiService.getBlockedUsers(),
  })

  const unblockMutation = useMutation({
    mutationFn: (userId: number) => apiService.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      showToast('success', 'کاربر از لیست بلاک حذف شد')
      setUnblockUserId(null)
    },
    onError: (error: any) => {
      showToast('error', extractErrorMessage(error))
    },
  })

  const handleUnblock = () => {
    if (unblockUserId) {
      unblockMutation.mutate(unblockUserId)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">
            لیست کاربران بلاک شده
          </h1>
          <p className="text-neutral-600 font-light">
            کاربرانی که آن‌ها را بلاک کرده‌اید
          </p>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!isLoading && blockedUsers && blockedUsers.length === 0 && (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            }
            title="لیست خالی است"
            description="شما هیچ کاربری را بلاک نکرده‌اید."
          />
        )}

        {!isLoading && blockedUsers && blockedUsers.length > 0 && (
          <Card variant="bordered" className="overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
                      <span className="text-neutral-600 font-bold text-lg">
                        {user.first_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-neutral-600 font-light" dir="ltr">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setUnblockUserId(parseInt(user.id))}
                  >
                    آنبلاک
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">توضیحات</p>
              <p className="font-light">
                کاربران بلاک شده نمی‌توانند به شما پیام ارسال کنند. شما می‌توانید هر زمان که
                بخواهید آن‌ها را آنبلاک کنید.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unblock Confirmation Modal */}
      <Modal
        isOpen={unblockUserId !== null}
        onClose={() => setUnblockUserId(null)}
        title="آنبلاک کاربر"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-700">
            آیا از آنبلاک این کاربر اطمینان دارید؟ این کاربر دوباره می‌تواند به شما پیام ارسال
            کند.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setUnblockUserId(null)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              onClick={handleUnblock}
              isLoading={unblockMutation.isPending}
            >
              آنبلاک
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

