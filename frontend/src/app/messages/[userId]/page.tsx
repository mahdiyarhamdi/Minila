'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useMessages, useSendMessage, useMarkAsRead } from '@/hooks/useMessages'
import { useAuth } from '@/contexts/AuthContext'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Textarea from '@/components/Textarea'
import LoadingSpinner from '@/components/LoadingSpinner'
import MessageBubble from '@/components/messages/MessageBubble'
import EmptyState from '@/components/EmptyState'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'

/**
 * صفحه چت با یک کاربر
 */
export default function ChatPage({ params }: { params: { userId: string } }) {
  const receiverId = parseInt(params.userId)
  const { user } = useAuth()
  const { showToast } = useToast()
  const { data: messagesData, isLoading } = useMessages(receiverId)
  const sendMutation = useSendMessage()
  const markAsReadMutation = useMarkAsRead()
  const [messageContent, setMessageContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (receiverId) {
      markAsReadMutation.mutate(receiverId)
    }
  }, [receiverId])

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesData])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageContent.trim()) {
      showToast('warning', 'لطفاً متن پیام را وارد کنید')
      return
    }

    try {
      await sendMutation.mutateAsync({
        receiver_id: receiverId,
        body: messageContent.trim(),
      })
      setMessageContent('')
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch (error: any) {
      showToast('error', extractErrorMessage(error))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const messages = [...(messagesData?.items || [])].reverse()
  const otherUser = messages.length > 0
    ? messages[0].sender.id === user?.id
      ? messages[0].receiver
      : messages[0].sender
    : null

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back & User Info */}
            <div className="flex items-center gap-4">
              <Link
                href="/messages"
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>

              {otherUser && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-bold">
                      {otherUser.first_name[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-medium text-neutral-900">
                      {otherUser.first_name} {otherUser.last_name}
                    </h2>
                    <p className="text-xs text-neutral-600 font-light" dir="ltr">
                      {otherUser.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
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
                title="هنوز پیامی وجود ندارد"
                description="اولین پیام را ارسال کنید و گفتگو را شروع کنید."
              />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  content={message.body}
                  isOwn={message.sender.id === user?.id}
                  timestamp={message.created_at}
                  senderName={
                    message.sender.id !== user?.id
                      ? `${message.sender.first_name} ${message.sender.last_name}`
                      : undefined
                  }
                  status={message.status}
                  isRead={message.is_read}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-white border-t border-neutral-200 sticky bottom-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <form onSubmit={handleSend} className="flex gap-2 sm:gap-3">
            <Textarea
              placeholder="پیام خود را بنویسید..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={1}
              className="flex-1 resize-none text-sm sm:text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
            />
            <Button
              type="submit"
              isLoading={sendMutation.isPending}
              disabled={!messageContent.trim()}
              className="flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </Button>
          </form>
          <p className="text-xs text-neutral-500 font-light mt-1.5 sm:mt-2 hidden sm:block">
            Enter برای ارسال، Shift+Enter برای خط جدید
          </p>
        </div>
      </div>
    </div>
  )
}

