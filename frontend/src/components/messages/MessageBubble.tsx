interface MessageBubbleProps {
  content: string
  isOwn: boolean
  timestamp: string
  senderName?: string
  status?: 'pending' | 'sent' | 'delivered'
  isRead?: boolean
}

/**
 * MessageBubble - حباب پیام در چت
 */
export default function MessageBubble({ 
  content, 
  isOwn, 
  timestamp, 
  senderName, 
  status = 'sent',
  isRead = false 
}: MessageBubbleProps) {
  // آیکون وضعیت برای پیام‌های خودی
  const StatusIcon = () => {
    if (!isOwn) return null

    switch (status) {
      case 'pending':
        // در حال ارسال - آیکون ساعت
        return (
          <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'sent':
        // ارسال شده - یک تیک
        return (
          <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'delivered':
        // خوانده شده - دو تیک آبی
        return (
          <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13l4 4L23 7" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className={`flex ${isOwn ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
        {/* Sender Name (برای پیام‌های دیگران) */}
        {!isOwn && senderName && (
          <p className="text-xs text-neutral-500 font-medium mb-1 px-1">{senderName}</p>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'bg-primary-600 text-white rounded-br-sm'
              : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        </div>

        {/* Timestamp & Status */}
        <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <p className="text-xs text-neutral-400">
            {new Date(timestamp).toLocaleTimeString('fa-IR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <StatusIcon />
        </div>
      </div>
    </div>
  )
}

