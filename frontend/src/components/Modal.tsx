'use client'

import { Fragment, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Modal (Dialog) با طراحی Notion-like
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-white rounded-2xl shadow-strong overflow-hidden',
          'animate-in fade-in zoom-in duration-200',
          {
            'max-w-sm w-full': size === 'sm',
            'max-w-md w-full': size === 'md',
            'max-w-2xl w-full': size === 'lg',
            'max-w-4xl w-full': size === 'xl',
          }
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label="بستن"
              >
                <svg
                  className="w-5 h-5 text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

