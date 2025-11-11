import Link from 'next/link'
import Card from '../Card'
import Badge from '../Badge'

interface CommunityCardProps {
  id: number
  name: string
  description?: string
  member_count: number
  is_member?: boolean
}

/**
 * CommunityCard - کارت کامیونیتی
 */
export default function CommunityCard({ id, name, description, member_count, is_member }: CommunityCardProps) {
  return (
    <Link href={`/communities/${id}`}>
      <Card variant="bordered" className="p-6 hover:shadow-medium transition-shadow cursor-pointer h-full">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-sand-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>

        {/* Name */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-neutral-900">{name}</h3>
          {is_member && (
            <Badge variant="success" size="sm">
              عضو
            </Badge>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-neutral-600 font-light line-clamp-2 mb-4">{description}</p>
        )}

        {/* Member Count */}
        <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span className="text-sm text-neutral-600">{member_count} عضو</span>
        </div>
      </Card>
    </Link>
  )
}

