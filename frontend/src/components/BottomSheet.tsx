'use client'

import { useEffect, useRef, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  className?: string
  closeOnBackdropClick?: boolean
  closeOnSwipe?: boolean
}

/**
 * BottomSheet - کامپوننت نمایش محتوا از پایین صفحه برای موبایل
 * با انیمیشن روان و قابلیت بستن با کلیک روی backdrop یا swipe
 */
export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  className,
  closeOnBackdropClick = true,
  closeOnSwipe = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)

  // Handle touch start for swipe gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!closeOnSwipe) return
    startY.current = e.touches[0].clientY
  }, [closeOnSwipe])

  // Handle touch move for swipe gesture
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!closeOnSwipe) return
    currentY.current = e.touches[0].clientY
    const delta = currentY.current - startY.current

    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`
    }
  }, [closeOnSwipe])

  // Handle touch end - close if swiped down enough
  const handleTouchEnd = useCallback(() => {
    if (!closeOnSwipe) return
    const delta = currentY.current - startY.current

    if (delta > 100) {
      onClose()
    }

    if (sheetRef.current) {
      sheetRef.current.style.transform = ''
    }
  }, [onClose, closeOnSwipe])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300 animate-fade-in"
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl',
          'max-h-[90vh] overflow-hidden',
          'animate-slide-up transition-transform duration-300',
          'shadow-strong',
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-neutral-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-3 border-b border-neutral-200">
            <h2
              id="bottom-sheet-title"
              className="text-lg font-bold text-neutral-900 text-center"
            >
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-60px)] overscroll-contain">
          {children}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

