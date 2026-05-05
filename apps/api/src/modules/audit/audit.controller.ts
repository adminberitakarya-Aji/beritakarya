import { Router, Request, Response } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import * as repo from './audit.repository'

export const auditRouter: Router = Router()

const withSite = [requireAuth, siteMiddleware, requireSiteAccess]

// GET /api/v1/audit  — list audit logs (superadmin/pimred only)
auditRouter.get('/', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  if (!['superadmin', 'pimred'].includes(req.user!.role)) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' })
  }

  const { action, entityType, userId, page, limit } = req.query
  const result = await repo.findAuditLogs(req.site!, {
    action: action as string,
    entityType: entityType as string,
    userId: userId as string,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 30,
  })

  res.json({ success: true, data: result })
}))

// GET /api/v1/audit/stats  — summary stats
auditRouter.get('/stats', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  if (!['superadmin', 'pimred'].includes(req.user!.role)) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' })
  }

  const stats = await repo.getAuditStats(req.site!)
  res.json({ success: true, data: stats })
}))
