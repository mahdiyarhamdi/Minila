'use client'

import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import Card from '../Card'
import Badge from '../Badge'

interface CommunityCardProps {
  id: number
  name: string
  slug: string
  bio?: string
  member_count?: number
  is_member?: boolean
  my_role?: 'owner' | 'member' | 'manager' | 'moderator' | null
}

/**
 * تعیین variant بر اساس نقش
 */
function getRoleVariant(role: string | null | undefined): 'success' | 'warning' | 'neutral' {
  switch (role) {
    case 'owner':
      return 'warning' // طلایی برای مالک
    case 'manager':
      return 'success' // سبز برای مدیر
    default:
      return 'neutral' // خنثی برای عضو
  }
}

/**
 * CommunityCard - کارت کامیونیتی
 */
export default function CommunityCard({ id, name, slug, bio, member_count, is_member, my_role }: CommunityCardProps) {
  const { t } = useTranslation()
  
  // Get translated role label
  const getRoleLabel = (role: string | null | undefined): string => {
    switch (role) {
      case 'owner':
        return t('communities.roles.owner')
      case 'manager':
        return t('communities.roles.manager')
      case 'moderator':
        return t('communities.roles.moderator')
      case 'member':
      default:
        return t('communities.roles.member')
    }
  }

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

        {/* Name and Slug */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-bold text-neutral-900">{name}</h3>
          {(is_member || my_role) && (
            <Badge variant={getRoleVariant(my_role)} size="sm">
              {getRoleLabel(my_role)}
            </Badge>
          )}
        </div>
        
        {/* Slug */}
        <div className="mb-2">
          <code className="text-xs font-mono text-neutral-500" dir="ltr">@{slug}</code>
        </div>

        {/* Description */}
        {bio && (
          <p className="text-sm text-neutral-600 font-light line-clamp-2 mb-4">{bio}</p>
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
          <span className="text-sm text-neutral-600">{t('communities.detail.members', { count: (member_count || 0).toString() })}</span>
        </div>
      </Card>
    </Link>
  )
}

