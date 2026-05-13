export type UserRole = 'reader' | 'journalist' | 'wapimred' | 'superadmin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  siteId: string | null  // null = editor pusat (akses semua site)
  isVerified: boolean
  kycSubmittedAt: string | null
  kycReviewedAt: string | null
  kycNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  siteId: string | null
  isVerified: boolean
  kycSubmittedAt: string | null
}

export interface JWTPayload {
  userId: string
  role: UserRole
  siteId: string | null
  iat: number
  exp: number
}