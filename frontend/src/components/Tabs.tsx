'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  children?: ReactNode
}

/**
 * Tabs با طراحی Notion-like
 */
export default function Tabs({ tabs, activeTab, onChange, children }: TabsProps) {
  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="border-b border-neutral-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all',
                'hover:bg-neutral-50',
                {
                  'text-primary-600 border-b-2 border-primary-600 bg-primary-50/30':
                    activeTab === tab.id,
                  'text-neutral-600': activeTab !== tab.id,
                }
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'mr-2 px-2 py-0.5 rounded-md text-xs',
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-neutral-100 text-neutral-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {children && <div className="pt-4">{children}</div>}
    </div>
  )
}

