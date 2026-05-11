import 'dotenv/config'
import { env } from './lib/env'
import './lib/envValidation'
import express from 'express'
import cors, { type CorsOptions } from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { specs } from './swagger'
import { authRouter } from './modules/auth/auth.controller'
import { userRouter } from './modules/user/user.controller'
import { articleRouter } from './modules/article/article.controller'
import { mediaRouter } from './modules/media/media.controller'
import { aiRouter } from './ai/ai.controller'
import { categoryRouter } from './modules/category/category.controller'
import { adRouter } from './modules/ad/ad.controller'
import { siteRouter } from './modules/site/site.controller'
import { newsletterRouter } from './modules/newsletter/newsletter.controller'
import { auditRouter } from './modules/audit/audit.controller'
import { analyticsRouter } from './modules/analytics/analytics.controller'
import { notificationRouter } from './modules/notification/notification.controller'
import { commentRouter } from './modules/comment/comment.controller'
import { requestIdMiddleware } from './middleware/requestId.middleware'
import { errorMiddleware } from './middleware/error.middleware'
import { sanitizeMiddleware } from './middleware/sanitize.middleware'
import { securityHeadersMiddleware } from './middleware/security.middleware'
import { performanceMiddleware } from './middleware/performance.middleware'
import { authLimiter, apiLimiter } from './lib/rateLimit'
import { prisma } from './db/client'
import { logger, httpLogger } from './lib/logger'
import { metrics } from './lib/monitoring'

const app = express()
app.set('trust proxy', 1) // Wajib untuk reverse proxy (Nginx) agar rate limit membaca IP asli client, bukan IP container Nginx
const PORT = env.PORT

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

// ── 1. Helmet DULU sebelum CORS ───────────────────────────────
// Helmet harus di-setup sebelum cors() agar tidak menimpa
// header Access-Control-Allow-Origin yang diset cors middleware.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false  // CSP dihandle oleh securityHeadersMiddleware
}))

// ── 2. CORS (Gerbang Utama) ───────────────────────────────────
// ── 2. CORS (Gerbang Utama) ───────────────────────────────────
const allowedOrigins: (string | RegExp)[] = [
  /^https?:\/\/(.+\.)?beritakarya\.co$/,
  /^https?:\/\/(.+\.)?beritakarya\.com$/,
  /^https?:\/\/(.+\.)?vercel\.app$/,
  'http://localhost:3000',
  'http://localhost:3001',
]

if (env.CORS_ORIGIN) {
  env.CORS_ORIGIN.split(',').forEach(o => allowedOrigins.push(o.trim()))
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-side)
    if (!origin) return callback(null, true)
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    )
    if (allowed) {
      callback(null, true)
    } else {
      callback(new Error(`Origin '${origin}' tidak diizinkan oleh CORS`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-Site-ID',
    'x-site-id',
    'X-API-Key',
    'x-api-key'
  ],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400  // Cache preflight 24 jam
}

// Handle preflight OPTIONS untuk SEMUA route
app.options('*', cors(corsOptions))
app.use(cors(corsOptions))

// ── 3. Security & Core Middlewares ───────────────────────────
app.use(securityHeadersMiddleware)

app.use(express.json({ limit: '10mb' }))
app.use(sanitizeMiddleware)
app.use(requestIdMiddleware)
app.use(httpLogger)
app.use(performanceMiddleware)

// ── Rate Limiting ──────────────────────────────────────────
app.use('/api/v1', apiLimiter)

// ── Routes ─────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, authRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/articles', articleRouter)
app.use('/api/v1/media', mediaRouter)
app.use('/api/v1/ai', aiRouter)
app.use('/api/v1/categories', categoryRouter)
app.use('/api/v1/ads', adRouter)
app.use('/api/v1/sites', siteRouter)
app.use('/api/v1/newsletter', newsletterRouter)
app.use('/api/v1/audit', auditRouter)
app.use('/api/v1/analytics', analyticsRouter)
app.use('/api/v1/notifications', notificationRouter)
app.use('/api/v1/comments', commentRouter)

import { asyncHandler } from './utils/asyncHandler'

// ── System Endpoints ───────────────────────────────────────
app.get('/health', asyncHandler(async (_, res) => {
  let databaseHealth = false
  try {
    await prisma.$queryRaw`SELECT 1`
    databaseHealth = true
  } catch (e) {
    logger.error('Database health check failed:', e)
  }

  const status = databaseHealth ? 'healthy' : 'unhealthy'
  res.status(databaseHealth ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: databaseHealth ? 'healthy' : 'unhealthy'
    }
  })
}))

app.get('/metrics', (_, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics: metrics.getSummary(),
    timestamp: new Date().toISOString()
  })
})

// ── Error Handling ─────────────────────────────────────────
app.use(errorMiddleware)

app.listen(PORT, () => {
  logger.info(`API berjalan di http://localhost:${PORT}`)
})