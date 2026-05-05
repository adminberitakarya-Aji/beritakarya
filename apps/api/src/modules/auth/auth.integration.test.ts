import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { authRouter } from './auth.controller'
import { errorMiddleware } from '../../middleware/error.middleware'

vi.mock('./auth.service', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  refreshAccessToken: vi.fn(),
  logoutUser: vi.fn()
}))

import * as authService from './auth.service'

const app = express()
app.use(express.json())
app.use('/api/v1/auth', authRouter)
app.use(errorMiddleware)

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: { id: 'u-1', email: 'test@test.com', name: 'Test', role: 'journalist', siteId: 'bandung' }
}

describe('POST /api/v1/auth/login', () => {
  it('200 dengan token saat login berhasil', async () => {
    vi.mocked(authService.loginUser).mockResolvedValue(mockTokens)
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'password123' })
    
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.refreshToken).toBeDefined()
    expect(res.body.data.user).toBeDefined()
  })

  it('400 dengan email format salah', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bukan-email', password: 'password123' })
    
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('400 saat service throw error kredensial salah', async () => {
    vi.mocked(authService.loginUser).mockRejectedValue(
      new Error('Email atau password salah')
    )
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'salah' })
    
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

describe('POST /api/v1/auth/register', () => {
  it('memaksa role journalist walau payload mengirim editor', async () => {
    vi.mocked(authService.registerUser).mockResolvedValue(mockTokens as any)

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'editor@test.com',
        password: 'password123',
        name: 'User Baru',
        role: 'editor',
        siteId: 'bandung'
      })

    expect(res.status).toBe(201)
    expect(authService.registerUser).toHaveBeenCalledWith(
      'editor@test.com',
      'password123',
      'User Baru',
      'journalist',
      'bandung'
    )
  })
})
