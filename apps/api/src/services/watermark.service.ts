import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { logger } from '../lib/logger'

export interface WatermarkOptions {
  text?: string
  opacity?: number
  fontSize?: number
}

export interface SaveResult {
  original: string
  thumbnail: string
}

export class WatermarkService {
  /**
   * Apply a tiled watermark to an image file (overwrites in-place).
   */
  static async applyWatermark(imagePath: string, options: WatermarkOptions = {}): Promise<void> {
    const {
      text = 'ONLY FOR BERITAKARYA VERIFICATION',
      opacity = 0.35,
      fontSize = 22
    } = options

    try {
      const imageBuffer = await fs.readFile(imagePath)
      const metadata = await sharp(imageBuffer).metadata()

      const width = metadata.width ?? 1200
      const height = metadata.height ?? 900

      // Build a tiled watermark: repeat text diagonally across the image
      const tileW = 500
      const tileH = 160
      const tileSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}">
          <text
            x="50%"
            y="50%"
            dominant-baseline="middle"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="${fontSize}"
            font-weight="bold"
            fill="rgba(220,38,38,${opacity})"
            transform="rotate(-35, ${tileW / 2}, ${tileH / 2})"
          >${text}</text>
        </svg>
      `

      const tileBuf = Buffer.from(tileSvg)

      // Tile the watermark to fill the image
      const composites: sharp.OverlayOptions[] = []
      for (let y = 0; y < height; y += tileH) {
        for (let x = 0; x < width; x += tileW) {
          composites.push({ input: tileBuf, top: y, left: x, blend: 'over' })
        }
      }

      // Also add a bold bottom-right attribution stamp
      const stampSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <rect
            x="${width - 420}" y="${height - 42}"
            width="410" height="34"
            rx="4" ry="4"
            fill="rgba(220,38,38,0.75)"
          />
          <text
            x="${width - 210}" y="${height - 20}"
            dominant-baseline="middle"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="13"
            font-weight="bold"
            fill="white"
          >BERITAKARYA · HANYA UNTUK VERIFIKASI</text>
        </svg>
      `
      composites.push({ input: Buffer.from(stampSvg), top: 0, left: 0, blend: 'over' })

      // Write watermarked image to a temp file first, then replace original
      const tmpPath = `${imagePath}.wm.tmp`
      await sharp(imageBuffer).composite(composites).toFile(tmpPath)
      await fs.rename(tmpPath, imagePath)

      logger.info(`[WatermarkService] Watermark applied: ${path.basename(imagePath)}`)
    } catch (error: any) {
      logger.error(`[WatermarkService] Failed to watermark ${imagePath}:`, error)
      throw error
    }
  }

  /**
   * Generate a small thumbnail (300×200 JPEG) for admin preview.
   */
  static async generateThumbnail(sourcePath: string, thumbPath: string): Promise<void> {
    try {
      await sharp(sourcePath)
        .resize(300, 200, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 72 })
        .toFile(thumbPath)

      logger.info(`[WatermarkService] Thumbnail generated: ${path.basename(thumbPath)}`)
    } catch (error: any) {
      logger.error(`[WatermarkService] Failed to generate thumbnail ${thumbPath}:`, error)
      throw error
    }
  }

  /**
   * Move a temp upload to permanent storage, apply watermark, and generate thumbnail.
   * Returns absolute paths to both the watermarked original and the thumbnail.
   */
  static async savePermanent(
    tempPath: string,
    userId: string,
    type: 'ktp' | 'kk',
    storageDir?: string
  ): Promise<SaveResult> {
    const { randomBytes } = await import('crypto')
    const hash = randomBytes(16).toString('hex')
    const ext = path.extname(tempPath) || '.jpg'
    const finalDir = storageDir ?? process.env.KYC_STORAGE_PATH ?? '/var/uploads/kyc'
    const filename = `${type}_${userId}_${hash}${ext}`
    const thumbFilename = `${type}_${userId}_${hash}_thumb.jpg`
    const finalPath = path.join(finalDir, filename)
    const thumbPath = path.join(finalDir, thumbFilename)

    await fs.mkdir(finalDir, { recursive: true })

    // Move temp → final location first
    await fs.rename(tempPath, finalPath)

    // Apply watermark in-place on the permanent file
    await WatermarkService.applyWatermark(finalPath)

    // Generate thumbnail from the watermarked image
    await WatermarkService.generateThumbnail(finalPath, thumbPath)

    return { original: finalPath, thumbnail: thumbPath }
  }
}
