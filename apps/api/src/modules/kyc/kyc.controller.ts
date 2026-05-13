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
import { StorageService } from '../../services/storage.service'
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
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string
    const status = req.query.status as string
    const skip = (page - 1) * limit

    const where: any = { siteId }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status === 'pending') {
      where.kycSubmittedAt = { not: null }
      where.isVerified = false
      where.kycNotes = { not: { contains: 'REJECTED' } }
    } else if (status === 'verified') {
      where.isVerified = true
    } else if (status === 'rejected') {
      where.kycNotes = { contains: 'REJECTED' }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { kycSubmittedAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isVerified: true,
          kycSubmittedAt: true,
          kycReviewedAt: true,
          kycNotes: true,
        }
      }),
      prisma.user.count({ where })
    ])

    res.json({ 
      success: true, 
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  })
)

// GET /stats - Get KYC editorial metrics
kycRouter.get('/stats',
  ...withSite,
  requireRole(['superadmin', 'wapimred']),
  asyncHandler(async (req: any, res: any) => {
    const { siteId } = req
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalPending,
      approvedThisWeek,
      rejectedThisWeek,
      allVerifiedUsers
    ] = await Promise.all([
      // Total Pending (Submitted but not verified and not rejected)
      prisma.user.count({
        where: { siteId, kycSubmittedAt: { not: null }, isVerified: false, kycNotes: { not: { contains: 'REJECTED' } } }
      }),
      // Approved This Week
      prisma.user.count({
        where: { siteId, isVerified: true, kycReviewedAt: { gte: oneWeekAgo } }
      }),
      // Rejected This Week
      prisma.user.count({
        where: { siteId, isVerified: false, kycNotes: { contains: 'REJECTED' }, kycReviewedAt: { gte: oneWeekAgo } }
      }),
      // All Verified Users (for avg time calculation)
      prisma.user.findMany({
        where: { siteId, isVerified: true, kycSubmittedAt: { not: null }, kycReviewedAt: { not: null } },
        select: { kycSubmittedAt: true, kycReviewedAt: true }
      })
    ])

    // Calculate Average Approval Time (in hours)
    let avgApprovalTime = 0
    if (allVerifiedUsers.length > 0) {
      const totalHours = allVerifiedUsers.reduce((sum, u) => {
        const diff = u.kycReviewedAt!.getTime() - u.kycSubmittedAt!.getTime()
        return sum + (diff / (1000 * 60 * 60))
      }, 0)
      avgApprovalTime = Math.round(totalHours / allVerifiedUsers.length)
    }

    res.json({
      success: true,
      data: {
        totalPending,
        approvedThisWeek,
        rejectedThisWeek,
        avgApprovalTime,
        conversionRate: Math.round((approvedThisWeek / (approvedThisWeek + rejectedThisWeek || 1)) * 100)
      }
    })
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

      // --- S3 UPLOAD START ---
      let idPath = idCardResult.original
      let familyPath = familyCardResult?.original

      if (process.env.STORAGE_TYPE === 's3') {
        try {
          const idKey = `kyc/${userId}/ktp_${Date.now()}.jpg`
          await StorageService.uploadFile(idCardResult.original, idKey, 'image/jpeg')
          idPath = idKey
          
          // Cleanup local
          await fs.unlink(idCardResult.original).catch(() => {})
          await fs.unlink(idCardResult.thumbnail).catch(() => {})

          if (familyCardResult) {
            const familyKey = `kyc/${userId}/kk_${Date.now()}.jpg`
            await StorageService.uploadFile(familyCardResult.original, familyKey, 'image/jpeg')
            familyPath = familyKey
            
            // Cleanup local
            await fs.unlink(familyCardResult.original).catch(() => {})
            await fs.unlink(familyCardResult.thumbnail).catch(() => {})
          }
        } catch (err) {
          logger.error(`S3 Upload failed: ${err}`)
          return res.status(500).json({ success: false, error: { message: 'Gagal mengunggah ke penyimpanan awan' } })
        }
      }
      // --- S3 UPLOAD END ---

      const updatedUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: userId },
          data: {
            bio: req.body.bio,
            idCardPath: idPath,
            familyCardPath: familyPath || null,
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

// GET /view/:userId/:type - Securely serve KYC documents
kycRouter.get('/view/:userId/:type',
  ...withSite,
  requireRole(['superadmin', 'wapimred']),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, type } = req.params // type: 'idCard' | 'familyCard'
    
    if (type !== 'idCard' && type !== 'familyCard') {
      return res.status(400).json({ success: false, error: { message: 'Tipe dokumen tidak valid' } })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { siteId: true, idCardPath: true, familyCardPath: true }
    })

    if (!targetUser) {
      return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } })
    }

    // Site access check for wapimred
    if (req.user!.role === 'wapimred' && targetUser.siteId !== req.site) {
      return res.status(403).json({ success: false, error: { message: 'Akses ditolak untuk situs ini' } })
    }

    const filePath = type === 'idCard' ? targetUser.idCardPath : targetUser.familyCardPath

    if (!filePath) {
      return res.status(404).json({ success: false, error: { message: 'File tidak ditemukan' } })
    }

    // Log the view for audit trail
    await prisma.kYCViewLog.create({
      data: {
        userId,
        viewerId: req.user!.userId,
        siteId: targetUser.siteId!,
        fileType: type === 'idCard' ? 'ktp' : 'kk',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    })

    if (process.env.STORAGE_TYPE === 's3') {
      try {
        const signedUrl = await StorageService.getSignedUrl(filePath, 300) // 5 minutes expiry
        return res.redirect(signedUrl)
      } catch (err) {
        logger.error(`Failed to get signed URL: ${err}`)
        return res.status(500).json({ success: false, error: { message: 'Gagal mengambil file dari penyimpanan awan' } })
      }
    }

    res.sendFile(filePath)
  })
)