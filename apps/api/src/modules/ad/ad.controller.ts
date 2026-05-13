import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { requireSiteAccess } from '../../middleware/site-scope.middleware'
import { asyncHandler } from '../../utils/asyncHandler'

export const adRouter = Router()

adRouter.get('/',
  requireAuth,
  requireRole(['superadmin', 'wapimred']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const ads = await prisma.advertisement.findMany({
      where: { siteId: req.site! },
      orderBy: { slot: 'asc' }
    })
    res.json({ success: true, data: ads })
  })
)

adRouter.post('/',
  requireAuth,
  requireRole(['superadmin', 'wapimred']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { slot, code, imageUrl, linkUrl, isActive } = req.body
    const ad = await prisma.advertisement.create({
      data: {
        siteId: req.site!,
        slot,
        code: code || null,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        isActive: isActive ?? true
      },
      select: { id: true, slot: true, code: true, imageUrl: true, linkUrl: true, isActive: true, createdAt: true }
    })
    res.status(201).json({ success: true, data: ad })
  })
)

adRouter.patch('/:id',
  requireAuth,
  requireRole(['superadmin', 'wapimred']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { slot, code, imageUrl, linkUrl, isActive } = req.body
    const ad = await prisma.advertisement.update({
      where: { id },
      data: {
        slot,
        code: code || null,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        isActive
      },
      select: { id: true, slot: true, code: true, imageUrl: true, linkUrl: true, isActive: true, updatedAt: true }
    })
    res.json({ success: true, data: ad })
  })
)

adRouter.delete('/:id',
  requireAuth,
  requireRole(['superadmin', 'wapimred']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    await prisma.advertisement.delete({
      where: { id }
    })
    res.json({ success: true, message: 'Advertisement deleted' })
  })
)