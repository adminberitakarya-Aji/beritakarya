import 'dotenv/config'
import { env } from './lib/env'
import express from 'express'
import cors from 'cors'
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
const PORT = env.PORT

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

// ── Security & Core Middlewares ────────────────────────────
app.use(helmet())
app.use(securityHeadersMiddleware)
app.use(cors({
  origin: (origin, callback) => {
    // Izinkan .co, .com, localhost, dan preview vercel
    const allowed = [
      /\.beritakarya\.co$/, 
      /\.beritakarya\.com$/, 
      /\.vercel\.app$/,
      /localhost/, 
      /127\.0\.0\.1/
    ]
    if (!origin || allowed.some(r => r.test(origin))) callback(null, true)
    else callback(new Error('CORS: origin tidak diizinkan'))
  },
  credentials: true
}))

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