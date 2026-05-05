import { Router, Request, Response } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import * as repo from './analytics.repository'

export const analyticsRouter: Router = Router()

const withSite = [requireAuth, siteMiddleware, requireSiteAccess]

analyticsRouter.get('/traffic', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 7
  const stats = await repo.getTrafficStats(req.site!, days)
  res.json({ success: true, data: stats })
}))

analyticsRouter.get('/top-content', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5
  const content = await repo.getTopContent(req.site!, limit)
  res.json({ success: true, data: content })
}))
