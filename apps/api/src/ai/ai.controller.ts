import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.middleware'
import { aiLimiter } from '../lib/rateLimit'
import { asyncHandler } from '../utils/asyncHandler'
import { logUsage } from './usage.service'
import * as writeService from './write.service'
import * as optimizeService from './optimize.service'
import * as validateService from './validate.service'
import * as layoutService from './layout.service'
import * as imageService from './image.service'

export const aiRouter: Router = Router()
aiRouter.use(requireAuth, aiLimiter)

async function withUsageLog(
  req: Request,
  action: string,
  input: string,
  fn: () => Promise<any>
) {
  const start = Date.now()
  const result = await fn()
  await logUsage({
    userId: req.user!.userId,
    siteId: req.user!.siteId ?? 'pusat',
    action,
    inputLength: input.length,
    outputLength: JSON.stringify(result.data ?? '').length,
    latencyMs: Date.now() - start,
    success: result.success
  })
  return result
}

// ── WRITE ─────────────────────────────────────────────────────
aiRouter.post('/rewrite', asyncHandler(async (req: Request, res: Response) => {
  const { content, tone, length, prevContent, nextContent } = z.object({
    content: z.string().min(10).max(5000),
    tone: z.enum(['formal','santai','berita']).default('berita'),
    length: z.enum(['lebih_pendek','sama','lebih_panjang']).default('sama'),
    prevContent: z.string().optional(),
    nextContent: z.string().optional()
  }).parse(req.body)

  const result = await withUsageLog(req, 'rewrite', content, () =>
    writeService.rewriteBlock(content, tone, length, {
      prev: prevContent, next: nextContent
    })
  )
  res.json(result)
}))

aiRouter.post('/expand', asyncHandler(async (req: Request, res: Response) => {
  const { content, prevContent, nextContent } = z.object({
    content: z.string().min(10).max(5000),
    prevContent: z.string().optional(),
    nextContent: z.string().optional()
  }).parse(req.body)

  const result = await withUsageLog(req, 'expand', content, () =>
    writeService.expandBlock(content, { prev: prevContent, next: nextContent })
  )
  res.json(result)
}))

// ── OPTIMIZE ──────────────────────────────────────────────────
aiRouter.post('/headline', asyncHandler(async (req: Request, res: Response) => {
  const { title, contentExcerpt } = z.object({
    title: z.string().min(3).max(200),
    contentExcerpt: z.string().max(1000)
  }).parse(req.body)

  const result = await withUsageLog(req, 'headline', title + contentExcerpt, () =>
    optimizeService.generateHeadlines(title, contentExcerpt)
  )
  res.json(result)
}))

aiRouter.post('/seo', asyncHandler(async (req: Request, res: Response) => {
  const { title, contentExcerpt } = z.object({
    title: z.string().min(3).max(200),
    contentExcerpt: z.string().max(2000)
  }).parse(req.body)

  const result = await withUsageLog(req, 'seo', title + contentExcerpt, () =>
    optimizeService.generateSEOMeta(title, contentExcerpt)
  )
  res.json(result)
}))

// ── VALIDATE ──────────────────────────────────────────────────
aiRouter.post('/grammar', asyncHandler(async (req: Request, res: Response) => {
  const { text } = z.object({ text: z.string().min(10).max(5000) }).parse(req.body)
  const result = await withUsageLog(req, 'grammar', text, () =>
    validateService.checkGrammar(text)
  )
  res.json(result)
}))

aiRouter.post('/readability', asyncHandler(async (req: Request, res: Response) => {
  const { text } = z.object({ text: z.string().min(50).max(10000) }).parse(req.body)
  const result = await withUsageLog(req, 'readability', text, () =>
    validateService.checkReadability(text)
  )
  res.json(result)
}))

// ── LAYOUT ────────────────────────────────────────────────────
aiRouter.post('/layout', asyncHandler(async (req: Request, res: Response) => {
  const { blocks } = z.object({
    blocks: z.array(z.any()).min(1).max(100)
  }).parse(req.body)

  const result = await withUsageLog(req, 'layout', JSON.stringify(blocks), () =>
    layoutService.analyzeLayout(blocks)
  )
  res.json(result)
}))

// ── IMAGE ─────────────────────────────────────────────────────
aiRouter.post('/caption', asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl } = z.object({
    imageUrl: z.string().url()
  }).parse(req.body)

  const result = await withUsageLog(req, 'caption', imageUrl, () =>
    imageService.generateCaption(imageUrl)
  )
  res.json(result)
}))