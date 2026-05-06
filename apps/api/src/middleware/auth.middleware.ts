import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JWTPayload } from '@beritakarya/types'
import { logger } from '../lib/logger'
import { env } from '../lib/env'

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      site?: string
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : (req.query.token as string)

  if (!token) {
    logger.warn(`Auth failed: No token found for ${req.path}`)
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token tidak ditemukan' }
    })
  }

  try {
    const payload = jwt.verify(
      token,
      env.JWT_SECRET
    ) as JWTPayload
    req.user = payload
    next()
  } catch (err: any) {
    logger.warn(`Auth failed: Invalid token for ${req.path} - ${err.message}`)
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_INVALID', message: 'Token tidak valid atau sudah expired' }
    })
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Belum login' }
      })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Akses ditolak' }
      })
    }
    next()
  }
}