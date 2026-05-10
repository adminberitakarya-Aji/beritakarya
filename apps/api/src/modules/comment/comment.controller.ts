import { Router, Request, Response } from 'express'
import * as service from './comment.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { requireAuth, optionalAuth } from '../../middleware/auth.middleware'

export const commentRouter = Router()

// Public: Get comments for an article
commentRouter.get('/article/:articleId', siteMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const comments = await service.getArticleComments(req.params.articleId, req.site!)
  res.json({ success: true, data: comments })
}))

// Public/Optional Auth: Add a comment
commentRouter.post('/article/:articleId', siteMiddleware, optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const comment = await service.addComment(req.params.articleId, req.site!, req.body, req.user)
  res.status(201).json({ success: true, data: comment })
}))

// Protected: Moderation queue
commentRouter.get('/moderation', requireAuth, siteMiddleware, requireSiteAccess, asyncHandler(async (req: Request, res: Response) => {
  if (!['superadmin', 'pimred'].includes(req.user!.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  const queue = await service.getModerationQueue(req.site!)
  res.json({ success: true, data: queue })
}))

// Protected: Approve/Reject
commentRouter.patch('/:id/approve', requireAuth, siteMiddleware, requireSiteAccess, asyncHandler(async (req: Request, res: Response) => {
  if (!['superadmin', 'pimred'].includes(req.user!.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  const comment = await service.approveComment(req.params.id)
  res.json({ success: true, data: comment })
}))

commentRouter.patch('/:id/reject', requireAuth, siteMiddleware, requireSiteAccess, asyncHandler(async (req: Request, res: Response) => {
  if (!['superadmin', 'pimred'].includes(req.user!.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  const comment = await service.rejectComment(req.params.id)
  res.json({ success: true, data: comment })
}))
