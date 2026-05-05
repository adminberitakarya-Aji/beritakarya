import { Request, Response, NextFunction } from 'express'
import { KNOWN_SITE_IDS } from '@beritakarya/config'

export function siteMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const siteId =
    (req.query.site as string) ||
    (req.headers['x-site-id'] as string)

  if (!siteId) {
    return res.status(400).json({
      success: false,
      error: { code: 'SITE_REQUIRED', message: 'Parameter site diperlukan' }
    })
  }

  const validSites = [...KNOWN_SITE_IDS];
  if (!validSites.includes('pusat')) validSites.push('pusat');

  if (!validSites.includes(siteId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'SITE_UNKNOWN', message: `Site "${siteId}" tidak dikenal` }
    })
  }

  req.site = siteId
  next()
}

export function requireSiteAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) return next()

  if (
    ['journalist', 'pimred'].includes(req.user.role) &&
    req.user.siteId !== req.site
  ) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'SITE_FORBIDDEN',
        message: 'Anda hanya bisa mengakses site Anda sendiri'
      }
    })
  }
  next()
}