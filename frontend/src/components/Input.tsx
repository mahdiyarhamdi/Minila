import { InputHTMLAttributes, forwardRef, useCallback } from 'react'
import { cn, convertToEnglishNumbers } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  convertNumbers?: boolean // Auto-convert Persian/Arabic numbers to English
}

/**
 * Input با طراحی Notion-like
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', onChange, convertNumbers = true, ...props }, ref) => {
    // Handle number conversion for numeric inputs
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (convertNumbers && (type === 'number' || type === 'tel' || props.inputMode === 'numeric' || props.inputMode === 'decimal')) {
        const converted = convertToEnglishNumbers(e.target.value)
        e.target.value = converted
      }
      onChange?.(e)
    }, [onChange, convertNumbers, type, props.inputMode])

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          type={type}
          onChange={handleChange}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border transition-all',
            'text-neutral-900 placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
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

Input.displayName = 'Input'

export default Input

