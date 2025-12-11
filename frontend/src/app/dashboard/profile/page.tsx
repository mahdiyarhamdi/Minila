'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import { apiService } from '@/lib/api'
import { extractErrorMessage } from '@/utils/errors'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Button from '@/components/Button'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useToast } from '@/components/Toast'

/**
 * صفحه ویرایش پروفایل
 */
export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { t, formatDate } = useTranslation()
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Change password state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
      })
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = t('auth.validation.firstNameRequired')
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = t('auth.validation.lastNameRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      showToast('error', t('errors.validation'))
      return
    }

    setIsLoading(true)

    try {
      await apiService.updateProfile(formData)
      showToast('success', t('profile.success'))
      // Refresh user data
      window.location.reload()
    } catch (error: unknown) {
      showToast('error', extractErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError(t('dashboard.changePassword.errors.fillAll'))
      return
    }

    if (newPassword.length < 8) {
      setPasswordError(t('dashboard.changePassword.errors.minLength'))
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('dashboard.changePassword.errors.mismatch'))
      return
    }

    if (oldPassword === newPassword) {
      setPasswordError(t('dashboard.changePassword.errors.sameAsOld'))
      return
    }

    setPasswordLoading(true)

    try {
      await apiService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      })

      setPasswordSuccess(t('dashboard.changePassword.success'))
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error)
      setPasswordError(errorMessage)
    } finally {
      setPasswordLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1 sm:mb-2">
            {t('profile.title')}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-light">
            {t('profile.subtitle')}
          </p>
        </div>

        {/* Profile Form */}
        <Card variant="elevated" className="p-6 sm:p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Placeholder */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-extrabold text-2xl sm:text-3xl">
                  {user.first_name[0]}
                </span>
              </div>
              <div className="text-center sm:text-start">
                <p className="text-sm text-neutral-600 font-light mb-2">
                  {t('profile.avatarPlaceholder')}
                </p>
                <Button size="sm" variant="secondary" disabled>
                  {t('profile.uploadAvatar')}
                </Button>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('profile.firstName') + ' *'}
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                error={errors.first_name}
              />
              <Input
                label={t('profile.lastName') + ' *'}
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                error={errors.last_name}
              />
            </div>

            {/* Email (Read-only) */}
            <Input
              label={t('profile.email')}
              value={user.email}
              disabled
              helperText={t('profile.emailHelper')}
            />

            {/* Submit Button */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                {t('profile.save')}
              </Button>
            </div>
          </form>
        </Card>

        {/* Account Info */}
        <Card variant="bordered" className="p-6 mb-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">
            {t('dashboard.accountInfo.title')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">{t('dashboard.accountInfo.email')}</span>
              <span className="font-medium text-neutral-900" dir="ltr">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-600 font-light">{t('dashboard.accountInfo.name')}</span>
              <span className="font-medium text-neutral-900">{user.first_name} {user.last_name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-neutral-600 font-light">{t('dashboard.accountInfo.joinDate')}</span>
              <span className="font-medium text-neutral-900">
                {formatDate(user.created_at)}
              </span>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card variant="bordered" className="p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">
            {t('dashboard.changePassword.title')}
          </h3>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="old-password" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('dashboard.changePassword.currentPassword')}
              </label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t('dashboard.changePassword.currentPasswordPlaceholder')}
                disabled={passwordLoading}
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('dashboard.changePassword.newPassword')}
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('dashboard.changePassword.newPasswordPlaceholder')}
                disabled={passwordLoading}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('dashboard.changePassword.confirmPassword')}
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('dashboard.changePassword.confirmPasswordPlaceholder')}
                disabled={passwordLoading}
              />
            </div>

            {passwordError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-medium">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-600 font-medium">{passwordSuccess}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={passwordLoading}
              className="w-full"
            >
              {passwordLoading ? t('dashboard.changePassword.submitting') : t('dashboard.changePassword.submitButton')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
