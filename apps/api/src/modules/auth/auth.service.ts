import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../db/client'
import type { JWTPayload } from '@beritakarya/types'

const ACCESS_SECRET = process.env.JWT_SECRET!
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m'
const REFRESH_EXPIRES_DAYS = 7

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

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role, siteId }
  })
  return generateTokenPair(user)
}

export async function refreshAccessToken(refreshToken: string) {
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
  await prisma.refreshToken.deleteMany({
    where: { userId, token: refreshToken }
  })
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