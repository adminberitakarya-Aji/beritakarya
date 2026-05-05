import { Router, Request, Response, NextFunction } from 'express'
import * as service from './site.service'
import { siteMiddleware } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'

export const siteRouter: Router = Router()

// Public endpoint to get site info
siteRouter.get('/settings', siteMiddleware, asyncHandler(async (req, res) => {
  const settings = await service.getSiteSettings(req.site!)
  res.json({ success: true, data: settings })
}))

// Admin only to update
siteRouter.patch('/settings', 
  siteMiddleware,
  requireAuth,
  requireRole('superadmin', 'pimred'),
  asyncHandler(async (req, res) => {
    const settings = await service.updateSiteSettings(req.site!, req.body)
    res.json({ success: true, data: settings })
  })
)
