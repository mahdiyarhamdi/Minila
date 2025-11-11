'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useConversations } from '@/hooks/useMessages'
import Card from '@/components/Card'
import Badge from '@/components/Badge'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'
import Input from '@/components/Input'

/**
 * صفحه لیست مکالمات
 */
export default function MessagesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, error } = useConversations()

  // فیلتر بر اساس جست‌وجو
  const filteredConversations = data?.items.filter((conv) =>
    `${conv.user.first_name} ${conv.user.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    conv.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenChat = (userId: number) => {
    router.push(`/messages/${userId}`)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">پیام‌ها</h1>
          <p className="text-neutral-600 font-light">
            مکالمات خود را مدیریت کنید
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            type="search"
            placeholder="جست‌وجو در مکالمات..."
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
            <p className="text-red-600 text-center">خطا در دریافت مکالمات</p>
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
            title="هیچ مکالمه‌ای یافت نشد"
            description={
              searchQuery
                ? 'مکالمه‌ای با این نام پیدا نشد'
                : 'هنوز با کسی چت نکرده‌اید. برای شروع چت، از طریق کارت‌ها پیام ارسال کنید.'
            }
            action={
              <Link href="/cards">
                <button className="text-primary-600 hover:text-primary-700 font-medium">
                  مشاهده کارت‌ها
                </button>
              </Link>
            }
          />
        )}

        {filteredConversations && filteredConversations.length > 0 && (
          <Card variant="bordered" className="overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.user.id}
                  onClick={() => handleOpenChat(conversation.user.id)}
                  className="w-full p-4 hover:bg-neutral-50 transition-colors text-right"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-bold text-lg">
                        {conversation.user.first_name[0]}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-neutral-900">
                          {conversation.user.first_name} {conversation.user.last_name}
                        </h3>
                        <span className="text-xs text-neutral-500 flex-shrink-0">
                          {new Date(conversation.last_message.created_at).toLocaleDateString(
                            'fa-IR'
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm truncate ${
                            !conversation.last_message.is_read
                              ? 'font-medium text-neutral-900'
                              : 'font-light text-neutral-600'
                          }`}
                        >
                          {conversation.last_message.content}
                        </p>
                        {conversation.unread_count > 0 && (
                          <Badge variant="error" size="sm" className="flex-shrink-0 mr-2">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

