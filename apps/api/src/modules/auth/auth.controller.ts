import { Router, Request, Response } from 'express'
import { z } from 'zod'
import * as authService from './auth.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { checkAccountLockout, recordFailedAttempt, resetFailedAttempts } from '../../lib/accountLockout'

export const authRouter: Router = Router()

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter')
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Harus mengandung huruf kapital')
    .regex(/[0-9]/, 'Harus mengandung angka')
    .regex(/[^A-Za-z0-9]/, 'Harus mengandung karakter spesial'),
  name: z.string().min(2),
  siteId: z.string().nullable().default(null)
})

authRouter.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)
  
  // Check account lockout
  if (checkAccountLockout(email)) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'ACCOUNT_LOCKED',
        message: 'Akun terkunci sementara. Coba lagi dalam 15 menit.'
      }
    })
  }
  
  try {
    const result = await authService.loginUser(email, password)
    resetFailedAttempts(email)
    res.json({ success: true, data: result })
  } catch (error) {
    recordFailedAttempt(email)
    throw error
  }
}))

authRouter.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body)
  const result = await authService.registerUser(
    input.email, input.password, input.name,
    'reader', input.siteId
  )
  res.status(201).json({ success: true, data: result })
}))

authRouter.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = z.object({
    refreshToken: z.string()
  }).parse(req.body)
  const result = await authService.refreshAccessToken(refreshToken)
  res.json({ success: true, data: result })
}))

authRouter.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const { userId, refreshToken } = z.object({
    userId: z.string(),
    refreshToken: z.string()
  }).parse(req.body)
  await authService.logoutUser(userId, refreshToken)
  res.json({ success: true, message: 'Logout berhasil' })
}))