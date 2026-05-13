import { Router, Request, Response } from 'express'
import multer from 'multer'
import os from 'os'
import fs from 'fs/promises'
import { prisma } from '../../db/client'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { FileValidator } from '../../services/file-validator.service'
import { WatermarkService } from '../../services/watermark.service'
import { sendNotification } from '../notification/notification.controller'
import { logger } from '../../lib/logger'

export const kycRouter = Router()

// Setup Multer for temporary storage in OS temp dir
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

const kycUpload = upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'familyCard', maxCount: 1 },
])

const withSite = [requireAuth, siteMiddleware, requireSiteAccess]

kycRouter.get('/',
  ...withSite,
  requireRole(['superadmin', 'wapimred']),
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
        kycSubmittedAt: true,
        kycReviewedAt: true,
        kycNotes: true
      },
      orderBy: { kycSubmittedAt: 'desc' }
    })
    res.json({ success: true, data: users })
  })
)

kycRouter.get('/:id',
  ...withSite,
  requireRole(['superadmin', 'wapimred']),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params
    const user = await prisma.user.findFirst({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        kycSubmittedAt: true,
        kycReviewedAt: true,
        kycNotes: true,
        kycDataExpiresAt: true,
        idCardPath: true,
        familyCardPath: true
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

// POST /submit - Submit KYC documents
kycRouter.post('/submit',
  ...withSite,
  kycUpload,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId
    const siteId = req.site!

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const idCard = files?.['idCard']?.[0]
    const familyCard = files?.['familyCard']?.[0]

    if (!idCard) {
      return res.status(400).json({ success: false, error: { message: 'KTP wajib diupload' } })
    }

    const consent = req.body.consent === 'true' || req.body.consent === '1'
    if (!consent) {
      return res.status(400).json({
        success: false,
        error: { message: 'Harus setuju kebijakan perlindungan data untuk melanjutkan' }
      })
    }

    // 1. Validate files
    const idCardValidation = await FileValidator.validateFile(idCard.path, idCard.originalname)
    if (!idCardValidation.valid) {
      await fs.unlink(idCard.path).catch(() => {})
      if (familyCard) await fs.unlink(familyCard.path).catch(() => {})
      return res.status(400).json({ success: false, error: { message: idCardValidation.error } })
    }

    if (familyCard) {
      const familyCardValidation = await FileValidator.validateFile(familyCard.path, familyCard.originalname)
      if (!familyCardValidation.valid) {
        await fs.unlink(idCard.path).catch(() => {})
        await fs.unlink(familyCard.path).catch(() => {})
        return res.status(400).json({ success: false, error: { message: familyCardValidation.error } })
      }
    }

    // 2. Check if already verified
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true }
    })

    if (user?.isVerified) {
      await fs.unlink(idCard.path).catch(() => {})
      if (familyCard) await fs.unlink(familyCard.path).catch(() => {})
      return res.status(400).json({ success: false, error: { message: 'KYC sudah disetujui' } })
    }

    // 3. Process and Save
    try {
      const idCardResult = await WatermarkService.savePermanent(idCard.path, userId, 'ktp')
      const familyCardResult = familyCard 
        ? await WatermarkService.savePermanent(familyCard.path, userId, 'kk')
        : null

      const updatedUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: userId },
          data: {
            bio: req.body.bio,
            idCardPath: idCardResult.original,
            familyCardPath: familyCardResult?.original,
            kycSubmittedAt: new Date(),
            kycConsentGivenAt: new Date(),
            kycDataExpiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years
            isVerified: false,
            kycNotes: `SUBMITTED at ${new Date().toISOString()}`
          }
        })

        // Audit log
        await tx.auditLog.create({
          data: {
            userId,
            siteId,
            action: 'kyc.submit',
            entityType: 'user',
            entityId: userId,
            newValue: { hasIdCard: true, hasFamilyCard: !!familyCard }
          }
        })

        return u
      })

      // 4. Notify Admins
      const admins = await prisma.user.findMany({
        where: {
          siteId,
          role: { in: ['superadmin', 'wapimred'] }
        },
        select: { id: true }
      })

      for (const admin of admins) {
        await sendNotification({
          userId: admin.id,
          siteId,
          type: 'kyc_submitted',
          title: '📝 Pengajuan KYC Baru',
          message: `User ${updatedUser.name} telah mengajukan verifikasi identitas.`,
          link: `/dashboard/admin/kyc/${userId}`
        })
      }

      res.status(200).json({ success: true, data: { message: 'KYC submitted successfully' } })
    } catch (error: any) {
      logger.error('KYC submission failed:', error)
      res.status(500).json({ success: false, error: { message: 'Gagal memproses pengajuan KYC' } })
    }
  })
)

// PATCH /:userId/verify - Admin verify KYC (approve/reject)
kycRouter.patch('/:userId/verify',
  ...withSite,
  requireRole(['superadmin', 'wapimred']),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const { status, notes } = req.body // status: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: { message: 'Status harus approved atau rejected' } })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { siteId: true, kycNotes: true, name: true }
    })

    if (!targetUser) {
      return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } })
    }

    // Site access check for wapimred
    if (req.user!.role === 'wapimred' && targetUser.siteId !== req.site) {
      return res.status(403).json({ success: false, error: { message: 'Akses ditolak untuk situs ini' } })
    }

    await prisma.$transaction(async (tx) => {
      const isApproved = status === 'approved'
      
      await tx.user.update({
        where: { id: userId },
        data: {
          isVerified: isApproved,
          kycNotes: `${status.toUpperCase()} at ${new Date().toISOString()}${notes ? ` - ${notes}` : ''}`,
          kycReviewedBy: req.user!.userId,
          kycReviewedAt: new Date(),
          role: isApproved ? 'journalist' : undefined // Promote to journalist if approved
        }
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: req.user!.userId,
          siteId: targetUser.siteId!,
          action: `kyc.${status}`,
          entityType: 'user',
          entityId: userId,
          newValue: { status, notes }
        }
      })

      // Notify User
      await sendNotification({
        userId,
        siteId: targetUser.siteId!,
        type: isApproved ? 'kyc_approved' : 'kyc_rejected',
        title: isApproved ? '✅ KYC Disetujui' : '❌ KYC Ditolak',
        message: isApproved 
          ? 'Selamat! Verifikasi identitas Anda telah disetujui. Anda sekarang dapat menerbitkan berita.'
          : `Verifikasi identitas Anda ditolak. Alasan: ${notes || 'Tidak memenuhi syarat'}.`,
        link: '/dashboard/settings'
      })
    })

    res.json({ success: true, data: { message: `KYC ${status} berhasil` } })
  })
)