import { Router } from 'express'
import { prisma } from '../../db/client'
import { requireAuth } from '../../middleware/auth.middleware'
import { requireSiteAccess } from '../../middleware/site-scope.middleware'
import { asyncHandler } from '../../utils/asyncHandler'

export const kycRouter = Router() as any

kycRouter.get('/',
  requireAuth,
  requireSiteAccess,
  asyncHandler(async (req: any, res: any) => {
    const { siteId } = req
    const users = await prisma.user.findMany({
      where: { siteId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        kycSubmittedAt: true,
        kycReviewedAt: true,
        kycNotes: true
      },
      orderBy: { kycSubmittedAt: 'desc' }
    })
    res.json({ success: true, data: users })
  })
)

kycRouter.get('/:id',
  requireAuth,
  requireSiteAccess,
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params
    const user = await prisma.user.findFirst({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        kycSubmittedAt: true,
        kycReviewedAt: true,
        kycNotes: true,
        kycDataExpiresAt: true,
        idCardPath: true,
        familyCardPath: true
      }
    })
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      })
    }
    res.json({ success: true, data: user })
  })
)