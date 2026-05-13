import { Router } from 'express'
import { prisma } from '../../db/client'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { requireSiteAccess } from '../../middleware/site-scope.middleware'
import { asyncHandler } from '../../utils/asyncHandler'

export const userRouter = Router()

userRouter.get('/',
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
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: users })
  })
)

userRouter.get('/:id',
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
        siteId: true,
        isVerified: true,
        createdAt: true
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

userRouter.put('/:id/role',
  requireAuth,
  requireSiteAccess,
  requireRole(['superadmin', 'wapimred']),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params
    const { role } = req.body
    const siteId = req.site

    // Verify user belongs to same site
    const user = await prisma.user.findFirst({
      where: { id, siteId }
    })
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found or does not belong to this site' }
      })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        siteId: true
      }
    })
    res.json({ success: true, data: updated })
  })
)