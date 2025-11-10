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
  id: string
  email: string
  first_name: string
  last_name: string
  is_email_verified: boolean
  is_system_banned: boolean
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

