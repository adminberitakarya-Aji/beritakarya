import { Router, Request, Response } from 'express'
import { z } from 'zod'
import * as service from './ad.service'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'

export const adRouter: Router = Router()

adRouter.use(siteMiddleware)

adRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const ads = await service.getAds(req.site!)
  res.json({ success: true, data: ads })
}))

const adSchema = z.object({
  slot: z.enum(['leaderboard', 'in_feed', 'sidebar']),
  code: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  isActive: z.boolean().default(true)
})

adRouter.post('/',
  requireAuth,
  requireRole('superadmin', 'pimred'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = adSchema.parse(req.body)
    const ad = await service.upsertAd(req.site!, input.slot, input)
    res.json({ success: true, data: ad })
  })
)

adRouter.delete('/:id',
  requireAuth,
  requireRole('superadmin', 'pimred'),
  asyncHandler(async (req: Request, res: Response) => {
    await service.deleteAd(req.params.id, req.site!)
    res.json({ success: true, message: 'Iklan dihapus' })
  })
)
