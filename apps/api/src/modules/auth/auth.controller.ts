import { Router, Request, Response } from 'express'
import { z } from 'zod'
import * as authService from './auth.service'
import { asyncHandler } from '../../utils/asyncHandler'

export const authRouter: Router = Router()

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter')
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  name: z.string().min(2),
  siteId: z.string().nullable().default(null)
})

authRouter.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)
  const result = await authService.loginUser(email, password)
  res.json({ success: true, data: result })
}))

authRouter.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body)
  const result = await authService.registerUser(
    input.email, input.password, input.name,
    'journalist', input.siteId
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