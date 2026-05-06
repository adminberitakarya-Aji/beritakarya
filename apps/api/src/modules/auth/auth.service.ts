import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../db/client'
import { env } from '../../lib/env'
import type { JWTPayload } from '@beritakarya/types'

const ACCESS_SECRET = env.JWT_SECRET
const ACCESS_EXPIRES = env.JWT_ACCESS_EXPIRES
const REFRESH_EXPIRES_DAYS = 7

export function validatePassword(password: string): boolean {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*]/.test(password)

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  )
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Email atau password salah')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('Email atau password salah')

  return generateTokenPair(user)
}

export async function registerUser(
  email: string, password: string, name: string,
  role: string, siteId: string | null
) {
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) throw new Error('Email sudah terdaftar')

  if (!validatePassword(password)) {
    throw new Error('Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus (!@#$%^&*)')
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role, siteId }
  })
  return generateTokenPair(user)
}

export async function refreshAccessToken(refreshToken: string) {
  const isBlacklisted = await prisma.blacklistedToken.findUnique({
    where: { token: refreshToken }
  })
  if (isBlacklisted) {
    throw new Error('Refresh token tidak valid atau sudah expired')
  }

  const record = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true }
  })
  if (!record || record.expiresAt < new Date()) {
    throw new Error('Refresh token tidak valid atau sudah expired')
  }
  return generateTokenPair(record.user)
}

export async function logoutUser(userId: string, refreshToken: string) {
  const refreshTokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken, userId }
  })

  if (refreshTokenRecord) {
    await prisma.blacklistedToken.create({
      data: {
        token: refreshToken,
        expiresAt: refreshTokenRecord.expiresAt
      }
    })

    await prisma.refreshToken.delete({
      where: { id: refreshTokenRecord.id }
    })
  }
}

async function generateTokenPair(user: any) {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    role: user.role,
    siteId: user.siteId
  }
  const accessToken = jwt.sign(payload, ACCESS_SECRET!, {
    expiresIn: ACCESS_EXPIRES
  } as any)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS)

  const { v4: uuidv4 } = await import('uuid')
  const refreshToken = uuidv4()
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt }
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      siteId: user.siteId
    }
  }
}