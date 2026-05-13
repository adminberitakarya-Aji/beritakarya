export type UserRole = 'reader' | 'journalist' | 'wapimred' | 'superadmin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  siteId: string | null  // null = editor pusat (akses semua site)
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  siteId: string | null
}

export interface JWTPayload {
  userId: string
  role: UserRole
  siteId: string | null
  iat: number
  exp: number
}