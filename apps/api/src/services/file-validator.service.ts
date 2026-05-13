import sharp from 'sharp'
import fs from 'fs/promises'
import { logger } from '../lib/logger'

// MIME type mapping from sharp format to actual MIME
const FORMAT_TO_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
 jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  tiff: 'image/tiff',
  avif: 'image/avif'
}

export class FileValidator {
  static readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  static async validateFile(
    filePath: string,
    originalName: string
  ): Promise<{ valid: boolean; error?: string; metadata?: any }> {
    try {
      const stats = await fs.stat(filePath)
      if (stats.size > this.MAX_FILE_SIZE) {
        return { valid: false, error: `File terlalu besar. Maksimal ${this.MAX_FILE_SIZE / 1024 / 1024}MB` }
      }

      // Use sharp to get image metadata including format
      const metadata = await sharp(filePath).metadata()
      if (!metadata.width || !metadata.height) {
        return { valid: false, error: 'File bukan gambar yang valid' }
      }

      // Get MIME from format
      const mime = FORMAT_TO_MIME[metadata.format?.toLowerCase() || ''] || 'application/octet-stream'
      if (!this.ALLOWED_MIME_TYPES.includes(mime)) {
        return { valid: false, error: `Tipe file tidak diizinkan: ${mime}` }
      }

      if (metadata.width < 1000 || metadata.height < 800) {
        return { valid: false, error: 'Resolusi terlalu rendah. Minimal 1000x800px' }
      }

      if (process.env.CLAMAV_ENABLED === 'true') {
        const isClean = await this.scanWithClamAV(filePath)
        if (!isClean) {
          await fs.unlink(filePath)
          return { valid: false, error: 'File terdeteksi berisi malware' }
        }
      }

      return {
        valid: true,
        metadata: { mime, width: metadata.width, height: metadata.height, format: metadata.format, size: stats.size }
      }
    } catch (error: any) {
      logger.error('File validation error:', error)
      return { valid: false, error: 'Validasi file gagal' }
    }
  }

  private static async scanWithClamAV(filePath: string): Promise<boolean> {
    return true // Placeholder
  }
}