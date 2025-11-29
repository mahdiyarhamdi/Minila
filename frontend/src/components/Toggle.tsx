import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  labelPosition?: 'left' | 'right'
  disabled?: boolean
  helperText?: string
  className?: string
}

/**
 * Toggle switch با طراحی Notion-like
 */
export default function Toggle({
  checked,
  onChange,
  label,
  labelPosition = 'right',
  disabled = false,
  helperText,
  className,
}: ToggleProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const toggleButton = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        {
          'bg-primary-600': checked && !disabled,
          'bg-neutral-200': !checked && !disabled,
          'bg-neutral-100 cursor-not-allowed': disabled,
        }
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
          {
            'translate-x-6': checked,
            'translate-x-1': !checked,
          }
        )}
      />
    </button>
  )

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-3">
        {label && labelPosition === 'left' && (
          <span
            className={cn(
              'text-sm font-medium cursor-pointer',
              disabled ? 'text-neutral-400' : 'text-neutral-700'
            )}
            onClick={handleClick}
          >
            {label}
          </span>
        )}
        
        {toggleButton}
        
        {label && labelPosition === 'right' && (
          <span
            className={cn(
              'text-sm font-medium cursor-pointer',
              disabled ? 'text-neutral-400' : 'text-neutral-700'
            )}
            onClick={handleClick}
          >
            {label}
          </span>
        )}
      </div>
      
      {helperText && (
        <p className="mt-1.5 text-sm text-neutral-500 font-light">{helperText}</p>
      )}
    </div>
  )
}

