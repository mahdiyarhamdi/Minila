'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Modal from './Modal'
import Button from './Button'
import { apiService } from '@/lib/api'
import { useTranslation } from '@/hooks/useTranslation'
import { useToast } from '@/components/Toast'
import { extractErrorMessage } from '@/utils/errors'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Modal for submitting user feedback/reports
 */
export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [body, setBody] = useState('')

  const createReportMutation = useMutation({
    mutationFn: () => apiService.createReport(body),
    onSuccess: () => {
      showToast('success', t('report.success'))
      setBody('')
      onClose()
    },
    onError: (error: any) => {
      showToast('error', extractErrorMessage(error))
    },
  })

  const handleSubmit = () => {
    if (body.trim().length < 10) {
      showToast('error', t('report.minLength'))
      return
    }
    createReportMutation.mutate()
  }

  const handleClose = () => {
    setBody('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('report.title')} size="md">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          {t('report.description')}
        </p>
        
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('report.placeholder')}
          className="w-full h-32 px-4 py-3 border border-neutral-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          dir="rtl"
        />
        
        <div className="text-xs text-neutral-500">
          {body.length}/2000 ({t('report.minChars')})
        </div>
        
        <div className="flex gap-3 justify-end pt-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={createReportMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={createReportMutation.isPending}
            disabled={body.trim().length < 10}
          >
            {t('report.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

