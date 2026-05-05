import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { aiRouter } from './ai.controller'
import { errorMiddleware } from '../middleware/error.middleware'

// Mock semua AI service agar tidak hit OpenAI
vi.mock('./write.service', () => ({
  rewriteBlock: vi.fn().mockResolvedValue({ success: true, data: 'teks hasil rewrite' }),
  expandBlock: vi.fn().mockResolvedValue({ success: true, data: 'teks hasil expand' })
}))

vi.mock('../middleware/auth.middleware', () => ({
  requireAuth: (_: any, __: any, next: any) => {
    _.user = { userId: 'u1', role: 'journalist', siteId: 'bandung' }
    next()
  }
}))

vi.mock('../lib/rateLimit', () => ({
  aiLimiter: (_: any, __: any, next: any) => next()
}))

vi.mock('./usage.service', () => ({
  logUsage: vi.fn()
}))

const app = express()
app.use(express.json())
app.use('/api/v1/ai', aiRouter)
app.use(errorMiddleware)

describe('AI endpoints', () => {
  it('POST /ai/rewrite — success', async () => {
    const res = await request(app)
      .post('/api/v1/ai/rewrite')
      .send({ content: 'Ini adalah paragraf yang akan ditulis ulang oleh AI.' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBe('teks hasil rewrite')
  })

  it('POST /ai/rewrite — validasi input terlalu pendek', async () => {
    const res = await request(app)
      .post('/api/v1/ai/rewrite')
      .send({ content: 'pendek' })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('Response shape konsisten: selalu ada field success', async () => {
    const res = await request(app)
      .post('/api/v1/ai/rewrite')
      .send({ content: 'Paragraf cukup panjang untuk diproses oleh AI service.' })
    expect(res.body).toHaveProperty('success')
  })
})