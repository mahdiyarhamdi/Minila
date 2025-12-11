'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  /** نوع لوگو: icon فقط آیکون، full با لوگوتایپ */
  variant?: 'icon' | 'full'
  /** سایز لوگو */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** لینک کلیک - اگر نباشد لینک نمی‌شود */
  href?: string
  /** کلاس اضافی */
  className?: string
}

const sizes = {
  sm: { icon: 32, full: 100 },
  md: { icon: 40, full: 140 },
  lg: { icon: 56, full: 180 },
  xl: { icon: 80, full: 240 },
}

/**
 * Logo - کامپوننت لوگوی Minila
 */
export default function Logo({ 
  variant = 'icon', 
  size = 'md', 
  href,
  className 
}: LogoProps) {
  const dimensions = sizes[size]
  
  const logoImage = (
    <Image
      src={variant === 'full' ? '/logo-with-text.png' : '/logo.png'}
      alt="Minila"
      width={dimensions[variant]}
      height={variant === 'full' ? dimensions[variant] * 0.8 : dimensions[variant]}
      className={cn('object-contain', className)}
      priority
    />
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {logoImage}
      </Link>
    )
  }

  return logoImage
}

