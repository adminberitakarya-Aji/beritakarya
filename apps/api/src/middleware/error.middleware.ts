import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../lib/logger'
import { env } from '../lib/env'

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'],
    userId: req.user?.userId,
    site: req.site,
  })

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input tidak valid',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }
    })
  }

  if (err.message?.includes('salah') ||
      err.message?.includes('terdaftar') ||
      err.message?.includes('tidak valid')) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: err.message }
    })
  }

  const statusCode = err.statusCode || 500
  const message = env.NODE_ENV === 'production'
    ? 'Terjadi kesalahan server'
    : err.message

  res.status(statusCode).json({
    success: false,
    error: { code: 'SERVER_ERROR', message }
  })
}