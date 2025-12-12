import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * ترکیب classهای Tailwind با پشتیبانی از شرطی
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

