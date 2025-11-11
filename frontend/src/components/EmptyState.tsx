import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

/**
 * EmptyState برای نمایش وضعیت خالی
 */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      {icon && <div className="mb-4 text-neutral-400">{icon}</div>}

      {/* Title */}
      <h3 className="text-lg font-bold text-neutral-900 mb-2">{title}</h3>

      {/* Description */}
      {description && <p className="text-neutral-600 font-light text-sm max-w-md mb-6">{description}</p>}

      {/* Action */}
      {action && <div>{action}</div>}
    </div>
  )
}

