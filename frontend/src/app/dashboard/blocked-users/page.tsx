'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/lib/api'
import { useTranslation } from '@/hooks/useTranslation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'

/**
 * Blocked users page
 */
export default function BlockedUsersPage() {
  const { t } = useTranslation()
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
      showToast('success', t('profile.blockedUsersPage.toast.unblocked'))
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
            {t('profile.blockedUsersPage.title')}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-light">
            {t('profile.blockedUsersPage.subtitle')}
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
            title={t('profile.blockedUsersPage.emptyTitle')}
            description={t('profile.blockedUsersPage.emptyDescription')}
          />
        )}

        {!isLoading && blockedUsers && blockedUsers.length > 0 && (
          <Card variant="bordered" className="overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-neutral-600 font-bold text-base sm:text-lg">
                        {(user.first_name || user.email)[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {user.first_name || ''} {user.last_name || ''}
                      </p>
                      <p className="text-xs sm:text-sm text-neutral-600 font-light truncate" dir="ltr">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setUnblockUserId(user.id)}
                    className="w-full sm:w-auto ltr:sm:mr-0 rtl:sm:ml-0"
                  >
                    {t('profile.blockedUsersPage.unblock')}
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
              <p className="font-medium mb-1">{t('profile.blockedUsersPage.infoTitle')}</p>
              <p className="font-light">
                {t('profile.blockedUsersPage.infoDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unblock Confirmation Modal */}
      <Modal
        isOpen={unblockUserId !== null}
        onClose={() => setUnblockUserId(null)}
        title={t('profile.blockedUsersPage.unblockModal.title')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm sm:text-base text-neutral-700">
            {t('profile.blockedUsersPage.unblockModal.message')}
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button variant="ghost" onClick={() => setUnblockUserId(null)} className="w-full sm:w-auto">
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleUnblock}
              isLoading={unblockMutation.isPending}
              className="w-full sm:w-auto"
            >
              {t('profile.blockedUsersPage.unblock')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
