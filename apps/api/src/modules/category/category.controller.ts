import { Router, Request, Response } from 'express'
import { z } from 'zod'
import * as service from './category.service'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'

export const categoryRouter = Router()

categoryRouter.use(siteMiddleware)

categoryRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const categories = await service.getCategories(req.site!)
  res.json({ success: true, data: categories })
}))

categoryRouter.post('/',
  requireAuth,
  requireRole('superadmin', 'pimred'),
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = z.object({ name: z.string().min(2) }).parse(req.body)
    const category = await service.createCategory(req.site!, name)
    res.status(201).json({ success: true, data: category })
  })
)

categoryRouter.put('/:id',
  requireAuth,
  requireRole('superadmin', 'pimred'),
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = z.object({ name: z.string().min(2) }).parse(req.body)
    const category = await service.updateCategory(req.params.id, req.site!, name)
    res.json({ success: true, data: category })
  })
)

categoryRouter.delete('/:id',
  requireAuth,
  requireRole('superadmin', 'pimred'),
  asyncHandler(async (req: Request, res: Response) => {
    await service.deleteCategory(req.params.id, req.site!)
    res.json({ success: true, message: 'Kategori dihapus' })
  })
)
