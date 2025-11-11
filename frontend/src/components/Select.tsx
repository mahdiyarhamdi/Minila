import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
}

/**
 * Select با طراحی Notion-like
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}
        
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border transition-all',
            'text-neutral-900 bg-white',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            {
              'border-neutral-200 focus:border-primary-500 focus:ring-primary-100': !error,
              'border-red-300 focus:border-red-500 focus:ring-red-100': error,
            },
            'disabled:bg-neutral-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
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

Select.displayName = 'Select'

export default Select

