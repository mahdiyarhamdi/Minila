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
 * Tabs با طراحی Notion-like و پشتیبانی از اسکرول افقی در موبایل
 */
export default function Tabs({ tabs, activeTab, onChange, children }: TabsProps) {
  return (
    <div className="w-full">
      {/* Tab Headers - با اسکرول افقی در موبایل */}
      <div className="border-b border-neutral-200">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-all whitespace-nowrap flex-shrink-0',
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
                    'mr-1.5 sm:mr-2 px-1.5 sm:px-2 py-0.5 rounded-md text-xs',
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

