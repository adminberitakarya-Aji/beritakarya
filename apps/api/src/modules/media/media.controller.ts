import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth } from '../../middleware/auth.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { siteMiddleware } from '../../middleware/site.middleware'
import * as repo from './media.repository'

export const mediaRouter = Router()

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const THUMB_DIR  = path.join(process.cwd(), 'uploads', 'thumbs')
;[UPLOAD_DIR, THUMB_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
})

const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF'))
  }
})

async function processImage(buffer: Buffer, filename: string) {
  const sharp = (await import('sharp')).default
  const meta  = await sharp(buffer).metadata()

  const maxW = 1920
  const needResize = (meta.width ?? 0) > maxW

  // Resize jika perlu
  let processedBuffer = buffer
  if (needResize) {
    processedBuffer = await sharp(buffer).resize(maxW).toBuffer()
  }

  // Generate SVG Watermark
  const currentMeta = await sharp(processedBuffer).metadata()
  const currentW = currentMeta.width || maxW
  const fontSize = Math.max(16, Math.floor(currentW * 0.025))
  const svgWidth = fontSize * 10
  const svgHeight = fontSize * 2
  
  const watermarkSvg = `<svg width="${svgWidth}" height="${svgHeight}">
    <style>
      .title { 
        fill: rgba(255, 255, 255, 0.4); 
        font-size: ${fontSize}px; 
        font-weight: 800; 
        font-family: Arial, sans-serif; 
        filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.6)); 
      }
    </style>
    <text x="${svgWidth - 20}" y="${svgHeight - 10}" text-anchor="end" class="title">BeritaKarya</text>
  </svg>`

  // Full size → Composite Watermark → WebP
  const fullName = `${filename}.webp`
  const fullPath = path.join(UPLOAD_DIR, fullName)
  
  await sharp(processedBuffer)
    .composite([{ input: Buffer.from(watermarkSvg), gravity: 'southeast' }])
    .webp({ quality: 82 })
    .toFile(fullPath)

  // Thumbnail 400px → WebP
  const thumbName = `${filename}_thumb.webp`
  const thumbPath = path.join(THUMB_DIR, thumbName)
  await sharp(buffer).resize(400).webp({ quality: 70 }).toFile(thumbPath)

  const finalMeta = await sharp(fullPath).metadata()
  return {
    fullName, thumbName,
    width: finalMeta.width ?? meta.width ?? 0,
    height: finalMeta.height ?? meta.height ?? 0,
    originalFormat: meta.format ?? 'unknown'
  }
}

mediaRouter.post(
  '/upload',
  requireAuth,
  siteMiddleware,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'File tidak ditemukan' }
      })
    }

    const id = uuidv4()
    const processed = await processImage(req.file.buffer, id)

    const baseUrl  = process.env.API_URL || 'http://localhost:4000'
    const url      = `${baseUrl}/api/v1/media/uploads/${processed.fullName}`
    const thumbUrl = `${baseUrl}/api/v1/media/uploads/thumbs/${processed.thumbName}`

    // Save to database
    const media = await repo.createMedia({
      url,
      thumbUrl,
      width: processed.width,
      height: processed.height,
      originalFormat: processed.originalFormat,
      size: req.file.size,
      userId: req.user!.userId,
      siteId: req.site,
      altText: req.body.altText,
      caption: req.body.caption,
      credit: req.body.credit
    })

    res.status(201).json({
      success: true,
      data: media
    })
  })
)

// GET /api/v1/media — list media
mediaRouter.get(
  '/',
  requireAuth,
  siteMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 30
    const result = await repo.findMediaBySite(req.site!, page, limit)
    res.json({ success: true, data: result })
  })
)

// PATCH /api/v1/media/:id — update metadata
mediaRouter.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { altText, caption, credit } = req.body
    const updated = await repo.updateMedia(req.params.id, { altText, caption, credit })
    res.json({ success: true, data: updated })
  })
)

// DELETE /api/v1/media/:id
mediaRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await repo.deleteMedia(req.params.id)
    res.json({ success: true, message: 'Media berhasil dihapus' })
  })
)

// Serve static files
const express = require('express')
mediaRouter.use('/uploads/thumbs', express.static(THUMB_DIR))
mediaRouter.use('/uploads',        express.static(UPLOAD_DIR))