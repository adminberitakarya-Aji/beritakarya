import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../db/client'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import * as repo from './user.repository'

export const userRouter: Router = Router()

userRouter.get('/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, siteId: true, createdAt: true }
    })
    if (!user) return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } })
    res.json({ success: true, data: user })
  })
)

userRouter.get('/',
  requireAuth,
  requireRole('superadmin', 'pimred'),
  siteMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      where: { siteId: req.site },
      select: { id: true, email: true, name: true, role: true, siteId: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: users })
  })
)

userRouter.get('/stats',
  requireAuth,
  requireRole('superadmin', 'pimred'),
  siteMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await repo.getTeamStats(req.site!)
    res.json({ success: true, data: stats })
  })
)

userRouter.post('/',
  requireAuth,
  requireRole('superadmin', 'pimred'),
  asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(2),
      role: z.enum(['reader', 'journalist', 'pimred', 'superadmin']),
      siteId: z.string().nullable()
    })
    const input = schema.parse(req.body)
    
    // Enforcement of RBAC
    if (req.user!.role === 'pimred') {
      if (input.role === 'superadmin' || input.role === 'pimred') {
        return res.status(403).json({ success: false, error: { message: 'Pimred hanya bisa membuat journalist atau reader' } })
      }
      input.siteId = req.site! // Force to Pimred's site
    }

    if (input.role !== 'superadmin' && !input.siteId) {
       return res.status(400).json({ success: false, error: { message: 'Role ini wajib memiliki siteId' } })
    }

    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.default.hash(input.password, 10)
    const user = await prisma.user.create({
      data: { ...input, passwordHash },
      select: { id: true, email: true, name: true, role: true, siteId: true }
    })
    res.status(201).json({ success: true, data: user })
  })
)

userRouter.put('/:id/role',
  requireAuth,
  requireRole('superadmin', 'pimred'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const schema = z.object({
      role: z.enum(['reader', 'journalist', 'pimred', 'superadmin'])
    })
    const { role } = schema.parse(req.body)
    
    if (req.user!.role === 'pimred' && (role === 'superadmin' || role === 'pimred')) {
      return res.status(403).json({ success: false, error: { message: 'Pimred hanya bisa mengubah menjadi journalist atau reader' } })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, name: true, role: true, siteId: true }
    })
    
    res.json({ success: true, data: updated })
  })
)