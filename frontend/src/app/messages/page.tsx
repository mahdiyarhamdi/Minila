'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useConversations } from '@/hooks/useMessages'
import { useTranslation } from '@/hooks/useTranslation'
import { apiService } from '@/lib/api'
import Card from '@/components/Card'
import Badge from '@/components/Badge'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'

/**
 * Conversations list page
 */
export default function MessagesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { t, formatDate } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, error } = useConversations()
  
  // State for open menu
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  
  // State for block/unblock modals
  const [blockUserId, setBlockUserId] = useState<number | null>(null)
  const [blockUserName, setBlockUserName] = useState<string>('')
  const [unblockUserId, setUnblockUserId] = useState<number | null>(null)
  const [unblockUserName, setUnblockUserName] = useState<string>('')

  // Get blocked users list
  const { data: blockedUsers } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => apiService.getBlockedUsers(),
  })

  // Convert to Set for quick lookup
  const blockedUserIds = new Set(blockedUsers?.map((u) => u.id) || [])

  // Block mutation
  const blockMutation = useMutation({
    mutationFn: (userId: number) => apiService.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      showToast('success', t('messages.toast.blocked'))
      setBlockUserId(null)
      setBlockUserName('')
    },
    onError: (error: any) => {
      showToast('error', extractErrorMessage(error))
    },
  })

  // Unblock mutation
  const unblockMutation = useMutation({
    mutationFn: (userId: number) => apiService.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      showToast('success', t('messages.toast.unblocked'))
      setUnblockUserId(null)
      setUnblockUserName('')
    },
    onError: (error: any) => {
      showToast('error', extractErrorMessage(error))
    },
  })

  // Filter by search query
  const filteredConversations = data?.items.filter((conv) =>
    `${conv.user.first_name} ${conv.user.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    conv.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenChat = (userId: number) => {
    router.push(`/messages/${userId}`)
  }

  const handleBlock = () => {
    if (blockUserId) {
      blockMutation.mutate(blockUserId)
    }
  }

  const handleUnblock = () => {
    if (unblockUserId) {
      unblockMutation.mutate(unblockUserId)
    }
  }

  const openBlockModal = (userId: number, userName: string) => {
    setBlockUserId(userId)
    setBlockUserName(userName)
    setOpenMenuId(null)
  }

  const openUnblockModal = (userId: number, userName: string) => {
    setUnblockUserId(userId)
    setUnblockUserName(userName)
    setOpenMenuId(null)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
            {t('messages.title')}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-light">
            {t('messages.subtitle')}
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            type="search"
            placeholder={t('messages.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Content */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <Card variant="bordered" className="p-6">
            <p className="text-red-600 text-center">{t('messages.error')}</p>
          </Card>
        )}

        {filteredConversations && filteredConversations.length === 0 && (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            }
            title={t('messages.noConversations')}
            description={
              searchQuery
                ? t('messages.noConversationsSearch')
                : t('messages.noConversationsEmpty')
            }
            action={
              <Link href="/cards">
                <button className="text-primary-600 hover:text-primary-700 font-medium">
                  {t('messages.viewCards')}
                </button>
              </Link>
            }
          />
        )}

        {filteredConversations && filteredConversations.length > 0 && (
          <Card variant="bordered" className="overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {filteredConversations.map((conversation) => {
                const isBlocked = blockedUserIds.has(conversation.user.id)
                const userName = `${conversation.user.first_name} ${conversation.user.last_name}`
                
                return (
                  <div
                    key={conversation.user.id}
                    className="flex items-center gap-2 p-4 hover:bg-neutral-50 transition-colors"
                  >
                    {/* Clickable area to open chat */}
                    <button
                      onClick={() => handleOpenChat(conversation.user.id)}
                      className="flex-1 flex items-center gap-4 ltr:text-left rtl:text-right min-w-0"
                    >
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isBlocked ? 'bg-neutral-200' : 'bg-primary-100'
                      }`}>
                        <span className={`font-bold text-lg ${
                          isBlocked ? 'text-neutral-500' : 'text-primary-600'
                        }`}>
                          {conversation.user.first_name[0]}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`${conversation.unread_count > 0 ? 'font-bold' : 'font-medium'} text-neutral-900`}>
                              {userName}
                            </h3>
                            {isBlocked && (
                              <Badge variant="neutral" size="sm">{t('messages.blocked')}</Badge>
                            )}
                          </div>
                          <span className="text-xs text-neutral-500 flex-shrink-0">
                            {formatDate(conversation.last_message.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-sm truncate ${
                              conversation.unread_count > 0
                                ? 'font-medium text-neutral-900'
                                : 'font-light text-neutral-600'
                            }`}
                          >
                            {conversation.last_message.body}
                          </p>
                          {conversation.unread_count > 0 && (
                            <Badge variant="error" size="sm" className="flex-shrink-0 ltr:ml-2 rtl:mr-2">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Three dot menu button */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          setMenuPosition({ top: rect.bottom + 4, left: rect.right - 160 })
                          setOpenMenuId(openMenuId === conversation.user.id ? null : conversation.user.id)
                        }}
                        className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                        aria-label={t('common.moreOptions')}
                      >
                        <svg className="w-5 h-5 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Dropdown menu - outside Card with fixed position */}
      {openMenuId !== null && filteredConversations && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpenMenuId(null)}
          />
          
          {/* Dropdown menu */}
          <div 
            className="fixed w-40 bg-white rounded-lg shadow-strong border border-neutral-200 z-50 overflow-hidden"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {(() => {
              const conversation = filteredConversations.find(c => c.user.id === openMenuId)
              if (!conversation) return null
              
              const isBlocked = blockedUserIds.has(conversation.user.id)
              const userName = `${conversation.user.first_name} ${conversation.user.last_name}`
              
              return isBlocked ? (
                <button
                  onClick={() => openUnblockModal(conversation.user.id, userName)}
                  className="w-full px-4 py-3 ltr:text-left rtl:text-right text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('messages.unblock')}
                </button>
              ) : (
                <button
                  onClick={() => openBlockModal(conversation.user.id, userName)}
                  className="w-full px-4 py-3 ltr:text-left rtl:text-right text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  {t('messages.block')}
                </button>
              )
            })()}
          </div>
        </>
      )}

      {/* Block Confirmation Modal */}
      <Modal
        isOpen={blockUserId !== null}
        onClose={() => {
          setBlockUserId(null)
          setBlockUserName('')
        }}
        title={t('messages.blockModal.title')}
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">{t('messages.blockModal.warning')}</p>
                <p className="font-light">
                  {t('messages.blockModal.message', { name: blockUserName })}
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-sm sm:text-base text-neutral-700">
            {t('messages.blockModal.confirm')}
          </p>
          
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setBlockUserId(null)
                setBlockUserName('')
              }}
              className="w-full sm:w-auto"
            >
              {t('messages.blockModal.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleBlock}
              isLoading={blockMutation.isPending}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {t('messages.blockModal.submit')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unblock Confirmation Modal */}
      <Modal
        isOpen={unblockUserId !== null}
        onClose={() => {
          setUnblockUserId(null)
          setUnblockUserName('')
        }}
        title={t('messages.unblockModal.title')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm sm:text-base text-neutral-700">
            {t('messages.unblockModal.message', { name: unblockUserName })}
          </p>
          
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setUnblockUserId(null)
                setUnblockUserName('')
              }}
              className="w-full sm:w-auto"
            >
              {t('messages.unblockModal.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleUnblock}
              isLoading={unblockMutation.isPending}
              className="w-full sm:w-auto"
            >
              {t('messages.unblockModal.submit')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
