'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'
import { apiService } from '@/lib/api'
import { useTranslation } from '@/hooks/useTranslation'

/**
 * Change password page
 */
export default function ChangePasswordPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Schema for validation
  const changePasswordSchema = z.object({
    old_password: z.string().min(8, t('dashboard.changePassword.errors.minLength')),
    new_password: z.string().min(8, t('dashboard.changePassword.errors.minLength')),
    confirm_password: z.string(),
  }).refine((data) => data.new_password === data.confirm_password, {
    message: t('dashboard.changePassword.errors.mismatch'),
    path: ['confirm_password'],
  })

  type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setError('')
      setSuccess(false)
      
      await apiService.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
      })
      
      setSuccess(true)
      reset()
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || t('common.error'))
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-50 via-sand-50 to-primary-50">
      {/* Logo and title */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-neutral-900 mb-2">{t('app.name')}</h1>
        <p className="text-neutral-600 font-light text-base">{t('app.tagline')}</p>
      </div>

      {/* Main card */}
      <Card variant="elevated" className="w-full max-w-md p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-neutral-600 hover:text-neutral-900 text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('nav.dashboard')}
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('dashboard.changePassword.success')}</h2>
            <p className="text-neutral-600 font-light">
              {t('dashboard.changePassword.successRedirect')}
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('dashboard.changePassword.title')}</h2>
            <p className="text-neutral-600 font-light mb-6">
              {t('dashboard.changePassword.subtitle')}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                {...register('old_password')}
                label={t('dashboard.changePassword.currentPassword')}
                type="password"
                placeholder="••••••••"
                error={errors.old_password?.message}
              />

              <Input
                {...register('new_password')}
                label={t('dashboard.changePassword.newPassword')}
                type="password"
                placeholder="••••••••"
                error={errors.new_password?.message}
                helperText={t('dashboard.changePassword.newPasswordPlaceholder')}
              />

              <Input
                {...register('confirm_password')}
                label={t('dashboard.changePassword.confirmPassword')}
                type="password"
                placeholder="••••••••"
                error={errors.confirm_password?.message}
              />

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
              >
                {t('dashboard.changePassword.submitButton')}
              </Button>
            </form>
          </>
        )}
      </Card>

      {/* Footer */}
      <p className="mt-8 text-sm text-neutral-500 text-center font-light">
        {t('dashboard.changePassword.securityNote')}
      </p>
    </div>
  )
}
