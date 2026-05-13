import { Request, Response, NextFunction } from 'express'
import { JWTPayload } from '@beritakarya/types'

// Extend Express Request type to include user and site
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      site?: string
    }
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    })
  }
  next()
}

/**
 * Middleware to require specific roles
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      })
    }

    next()
  }
}

/**
 * Middleware to require superadmin role
 */
export function requireSuperadmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    })
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Superadmin access required' }
    })
  }

  next()
}