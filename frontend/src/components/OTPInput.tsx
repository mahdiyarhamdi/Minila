'use client'

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  error?: string
  label?: string
  disabled?: boolean
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  error,
  label,
  disabled = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [localValues, setLocalValues] = useState<string[]>(Array(length).fill(''))

  // Sync external value with local state
  useEffect(() => {
    const chars = value.split('').slice(0, length)
    const newValues = Array(length).fill('')
    chars.forEach((char, i) => {
      newValues[i] = char
    })
    setLocalValues(newValues)
  }, [value, length])

  const updateValue = (newValues: string[]) => {
    setLocalValues(newValues)
    onChange(newValues.join(''))
  }

  const handleChange = (index: number, inputValue: string) => {
    // Only allow single digit
    const digit = inputValue.replace(/\D/g, '').slice(-1)
    
    const newValues = [...localValues]
    newValues[index] = digit
    updateValue(newValues)

    // Auto-focus next input if digit entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!localValues[index] && index > 0) {
        // If current is empty, go back and clear previous
        const newValues = [...localValues]
        newValues[index - 1] = ''
        updateValue(newValues)
        inputRefs.current[index - 1]?.focus()
      } else {
        // Clear current
        const newValues = [...localValues]
        newValues[index] = ''
        updateValue(newValues)
      }
    }

    // Handle left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // Handle right arrow
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    
    if (pastedData) {
      const newValues = Array(length).fill('')
      pastedData.split('').forEach((char, i) => {
        newValues[i] = char
      })
      updateValue(newValues)
      
      // Focus last filled input or last input
      const lastFilledIndex = Math.min(pastedData.length - 1, length - 1)
      inputRefs.current[lastFilledIndex]?.focus()
    }
  }

  const handleFocus = (index: number) => {
    // Select the input content on focus
    inputRefs.current[index]?.select()
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="flex gap-2 sm:gap-3 justify-center" dir="ltr">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={localValues[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            className={`
              w-10 h-12 sm:w-12 sm:h-14
              text-center text-xl sm:text-2xl font-semibold
              border-2 rounded-xl
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              disabled:bg-neutral-100 disabled:cursor-not-allowed
              ${error 
                ? 'border-red-300 bg-red-50 text-red-900' 
                : 'border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400'
              }
            `}
          />
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}

