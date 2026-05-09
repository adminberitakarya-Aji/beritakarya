import { Request, Response, NextFunction } from 'express'
import { env } from '../lib/env'

/**
 * Middleware for adding security-related HTTP headers
 */
export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  // Prevent clickjacking by forbidding iframe nesting
  res.setHeader('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy - disable unused browser features
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )

  // Add HSTS
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // Add XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block')

  // Content Security Policy (CSP)
  const isDev = env.NODE_ENV !== 'production'
  if (!isDev) {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.beritakarya.co https://beritakarya.co",
        "frame-ancestors 'none'"
      ].join('; ')
    )
  }

  // Handle CORS Preflight - Don't add CSP to OPTIONS requests
  if (_req.method === 'OPTIONS') {
    return next()
  }

  next()
}