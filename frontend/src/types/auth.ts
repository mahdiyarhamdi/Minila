/**
 * تایپ‌های مربوط به authentication
 */

export interface SignupData {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface RequestOTPData {
  email: string
}

export interface VerifyOTPData {
  email: string
  otp_code: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface User {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  email_verified: boolean
  is_active: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface ChangePasswordData {
  old_password: string
  new_password: string
}

export interface APIError {
  detail: string
}

