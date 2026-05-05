import { Request, Response, NextFunction } from 'express'
import { JSDOM } from 'jsdom'
import DOMPurify from 'dompurify'

const { window } = new JSDOM('')
const purify = DOMPurify(window as any)

// Config: izinkan tag inline saja (bold, italic, link)
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'a', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  FORCE_BODY: true
}

function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return purify.sanitize(value, PURIFY_CONFIG)
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }
  if (value && typeof value === 'object') {
    const result: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeValue(v)
    }
    return result
  }
  return value
}

/**
 * Middleware untuk membersihkan input HTML dari request body
 * Mencegah XSS dengan membatasi tag yang diizinkan
 */
export function sanitizeMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (req.body) {
    req.body = sanitizeValue(req.body)
  }
  next()
}
