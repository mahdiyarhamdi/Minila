/**
 * useTranslation Hook
 * 
 * A convenient re-export of useLanguage for translation purposes.
 * This follows the common i18n pattern of using useTranslation() hook.
 */

import { useLanguage } from '@/contexts/LanguageContext'

export function useTranslation() {
  return useLanguage()
}

export default useTranslation

