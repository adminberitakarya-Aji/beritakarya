import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import { requireAuth } from '../../middleware/auth.middleware'
import { requireSiteAccess } from '../../middleware/site-scope.middleware'
import { asyncHandler } from '../../utils/asyncHandler'

export const commentRouter = Router() as any

commentRouter.get('/',
  requireAuth,
  requireSiteAccess,
  asyncHandler(async (req: any, res: any) => {
    const { siteId } = req
    const comments = await prisma.comment.findMany({
      where: { siteId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        article: { select: { id: true, title: true, slug: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: comments })
  })
)

commentRouter.get('/:id',
  requireAuth,
  requireSiteAccess,
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        article: { select: { id: true, title: true, slug: true } }
      }
    })
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' }
      })
    }
    res.json({ success: true, data: comment })
  })
)

commentRouter.post('/',
  requireAuth,
  requireSiteAccess,
  asyncHandler(async (req: any, res: any) => {
    const { articleId, content } = req.body
    const siteId = req.site

    // Verify article belongs to same site
    const article = await prisma.article.findFirst({
      where: { id: articleId, siteId }
    })
    if (!article) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ARTICLE', message: 'Article not found or does not belong to this site' }
      })
    }

    const comment = await prisma.comment.create({
      data: {
        siteId,
        articleId,
        authorId: req.user?.userId,
        content
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    })
    res.status(201).json({ success: true, data: comment })
  })
)

commentRouter.put('/:id',
  requireAuth,
  requireSiteAccess,
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params
    const { content } = req.body
    const siteId = req.site

    // Check ownership
    const existing = await prisma.comment.findFirst({
      where: { id, siteId }
    })
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' }
      })
    }
    if (existing.authorId !== req.user?.userId && req.user?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not your comment' }
      })
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: { select: { id: true, name: true } }
      }
    })
    res.json({ success: true, data: comment })
  })
)

commentRouter.delete('/:id',
  requireAuth,
  requireSiteAccess,
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params
    const siteId = req.site

    // Check ownership
    const existing = await prisma.comment.findFirst({
      where: { id, siteId }
    })
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' }
      })
    }
    if (existing.authorId !== req.user?.userId && req.user?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not your comment' }
      })
    }

    await prisma.comment.delete({ where: { id } })
    res.json({ success: true, message: 'Comment deleted' })
  })
)