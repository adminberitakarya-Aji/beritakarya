import 'dotenv/config'
import * as Sentry from '@sentry/node'
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
import { adRouter } from './modules/ad/ad.controller'
import { newsletterRouter } from './modules/newsletter/newsletter.controller'
import { auditRouter } from './modules/audit/audit.controller'
import { analyticsRouter } from './modules/analytics/analytics.controller'
import { notificationRouter } from './modules/notification/notification.controller'
import { commentRouter } from './modules/comment/comment.controller'
import { kycRouter } from './modules/kyc/kyc.controller'
import adminRouter from './admin/admin.router'
import cron from 'node-cron'
import { runKYCCleanup } from './cron/kyc-cleanup'
import { checkAllQuotas } from './middleware/quotaNotifications'
import { requestIdMiddleware } from './middleware/requestId.middleware'
import { errorMiddleware } from './middleware/error.middleware'
import { sanitizeMiddleware } from './middleware/sanitize.middleware'
import { securityHeadersMiddleware } from './middleware/security.middleware'
import { performanceMiddleware } from './middleware/performance.middleware'
import { authLimiter, apiLimiter } from './lib/rateLimit'
import { prisma } from './db/client'
import { logger, httpLogger } from './lib/logger'
import { metrics } from './lib/monitoring'
import { asyncHandler } from './utils/asyncHandler'
import timeout from 'connect-timeout'

// Import global type augmentation (must be before other imports)
import './types/express'

// Import controller functions
import * as categoryController from './modules/category/category.controller'
import * as siteController from './modules/site/site.controller'

// Initialize Sentry error tracking
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    beforeSend(event, hint) {
      // Sanitize sensitive data before sending
      if (event.request) {
        if (event.request.headers?.authorization) {
          event.request.headers.authorization = '[REDACTED]'
        }
        if (event.request.headers?.cookie) {
          event.request.headers.cookie = '[REDACTED]'
        }
      }
      return event
    }
  })
}

const app = express()
app.set('trust proxy', 1)
const PORT = env.PORT

// Request timeout middleware (30 seconds)
app.use(timeout('30s'))
app.use((req, res, next) => {
  if (!req.timedout) next()
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}))

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
  maxAge: 86400
}

app.options('*', cors(corsOptions))
app.use(cors(corsOptions))

app.use(securityHeadersMiddleware)

app.use(express.json({ limit: '10mb' }))
app.use(sanitizeMiddleware)
app.use(requestIdMiddleware)
app.use(httpLogger)
app.use(performanceMiddleware)

app.use('/api/v1', apiLimiter)

app.use('/api/v1/auth', authLimiter, authRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/articles', articleRouter)
app.use('/api/v1/media', mediaRouter)
app.use('/api/v1/ai', aiRouter)

// Category routes - using functions directly (not routers)
app.get('/api/v1/categories', asyncHandler(categoryController.getCategories))
app.post('/api/v1/categories', asyncHandler(categoryController.createCategory))
app.put('/api/v1/categories/:id', asyncHandler(categoryController.updateCategory))
app.delete('/api/v1/categories/:id', asyncHandler(categoryController.deleteCategory))

// Site routes - using functions directly
app.get('/api/v1/sites', asyncHandler(siteController.getSites))
app.get('/api/v1/sites/:id', asyncHandler(siteController.getSiteById))
app.post('/api/v1/sites', asyncHandler(siteController.createSite))
app.put('/api/v1/sites/:id', asyncHandler(siteController.updateSite))
app.delete('/api/v1/sites/:id', asyncHandler(siteController.deleteSite))
app.post('/api/v1/sites/:id/wapimred', asyncHandler(siteController.assignWapimred))

app.use('/api/v1/ads', adRouter)
app.use('/api/v1/newsletter', newsletterRouter)
app.use('/api/v1/audit', auditRouter)
app.use('/api/v1/analytics', analyticsRouter)
app.use('/api/v1/notifications', notificationRouter)
app.use('/api/v1/comments', commentRouter)
app.use('/api/v1/kyc', kycRouter)
app.use('/api/v1/admin', adminRouter)

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

app.use(errorMiddleware)

// Capture unhandled errors globally if Sentry is enabled
if (env.SENTRY_DSN) {
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error)
    Sentry.close()
    process.exit(1)
  })

  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason)
    Sentry.close()
    process.exit(1)
  })
}

const server = app.listen(PORT, () => {
  logger.info(`API berjalan di http://localhost:${PORT}`)
})

// ── CRON JOBS ────────────────────────────────────────────────────────────
// Hourly AI quota check: warn users approaching limits, disable if exceeded
cron.schedule('0 * * * *', async () => {
  logger.info('Running hourly AI quota check...')
  try {
    await checkAllQuotas()
  } catch (err) {
    logger.error('Hourly quota check failed:', err)
  }
})

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  try {
    await prisma.$disconnect()
    server.close(() => {
      logger.info('Server closed')
      process.exit(0)
    })
  } catch (error) {
    logger.error('Error during graceful shutdown:', error)
    process.exit(1)
  }
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  try {
    await prisma.$disconnect()
    server.close(() => {
      logger.info('Server closed')
      process.exit(0)
    })
  } catch (error) {
    logger.error('Error during graceful shutdown:', error)
    process.exit(1)
  }
})
