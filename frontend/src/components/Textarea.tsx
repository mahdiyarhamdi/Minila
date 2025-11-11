import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

/**
 * Textarea با طراحی Notion-like
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, rows = 4, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border transition-all',
            'text-neutral-900 placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'resize-none',
            {
              'border-neutral-200 focus:border-primary-500 focus:ring-primary-100': !error,
              'border-red-300 focus:border-red-500 focus:ring-red-100': error,
            },
            'disabled:bg-neutral-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        
        {error && (
          <p className="mt-1.5 text-sm text-red-600 font-normal">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-neutral-500 font-light">{helperText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea

