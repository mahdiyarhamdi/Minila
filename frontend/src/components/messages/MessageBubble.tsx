interface MessageBubbleProps {
  content: string
  isOwn: boolean
  timestamp: string
  senderName?: string
}

/**
 * MessageBubble - حباب پیام در چت
 */
export default function MessageBubble({ content, isOwn, timestamp, senderName }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
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

        {/* Timestamp */}
        <p className={`text-xs text-neutral-400 mt-1 px-1 ${isOwn ? 'text-left' : 'text-right'}`}>
          {new Date(timestamp).toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}

