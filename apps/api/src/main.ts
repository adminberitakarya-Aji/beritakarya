import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
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
import { authLimiter, apiLimiter } from './lib/rateLimit'
import { logger, httpLogger } from './lib/logger'
import { metrics } from './lib/monitoring'

const app = express()
const PORT = process.env.PORT || 4000

// ── Security & Core Middlewares ────────────────────────────
app.use(helmet())
app.use(securityHeadersMiddleware)
app.use(cors({
  origin: (origin, callback) => {
    // In production, tighten this to your actual domains
    const allowed = [/\.beritakarya\.com$/, /localhost/, /127\.0\.0\.1/]
    if (!origin || allowed.some(r => r.test(origin))) callback(null, true)
    else callback(new Error('CORS: origin tidak diizinkan'))
  },
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(sanitizeMiddleware)
app.use(requestIdMiddleware)
app.use(httpLogger)

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

// ── System Endpoints ───────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

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