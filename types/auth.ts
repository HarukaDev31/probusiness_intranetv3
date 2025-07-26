// Tipos para autenticación y usuarios

export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar: string | null
  permissions: string[]
  lastLogin: string
  isActive: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  data: {
    user: User
    token: string
  } | null
  message?: string
  error?: string
}

export interface ApiLoginResponse {
  success: boolean
  data?: {
    user: {
      id?: string
      name?: string
      role?: string
      avatar?: string | null
      permissions?: string[]
    }
    token?: string
  }
  message?: string
  error?: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
  role?: string
}

export interface RegisterResponse {
  success: boolean
  data: {
    user: User
    token: string
  } | null
  message?: string
  error?: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetResponse {
  success: boolean
  message?: string
  error?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
  message?: string
  error?: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  avatar: string | null
  phone?: string
  department?: string
  position?: string
  permissions: string[]
  lastLogin: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileRequest {
  name?: string
  phone?: string
  department?: string
  position?: string
  avatar?: string
} 