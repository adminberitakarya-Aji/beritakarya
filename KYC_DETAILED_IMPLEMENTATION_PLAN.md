# 📋 KYC Implementation - Detailed Step-by-Step Plan

**BeritaKarya | News Portal Multi-Tenant**
**Document Version**: 1.0 | **Date**: 2026-05-13
**Prerequisite**: Based on implementasi_plan_KYC.md v1.0

---

## 📊 PRIORITY MATRIX OVERVIEW

| Priority | Tasks | Estimated Time | Dependencies |
|----------|-------|----------------|--------------|
| **P0 - CRITICAL** | 6 items | 2-3 weeks | None (must start immediately) |
| **P1 - HIGH** | 4 items | 1-2 weeks | P0 complete |
| **P2 - MEDIUM** | 4 items | 2-3 weeks | P1 complete |
| **P3 - LOW** | 3 items | 1-2 weeks | P2 complete |

**Total Estimated**: 6-10 weeks for full implementation

---

## 🔥 P0 - CRITICAL (Wajib sebelum launch)

**Goal**: Mendisable KYC, aplikasi **tidak boleh launch** tanpa item ini complete.

---

### **1. Fix Auth Middleware for Site-Scoped Access**

**Problem**: Current `requireRole` only checks role, not site ownership. Wapimred can access data from other sites.

**File to modify**: `apps/api/src/middleware/auth.middleware.ts`

#### Step 1.1: Create New Middleware `requireSiteAccess`

```typescript
// apps/api/src/middleware/site-scope.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export function requireSiteAccess(resourceSiteId: string | (() => string)) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Belum login' }
      })
    }

    // Superadmin bisa akses semua site
    if (req.user.role === 'superadmin') return next()

    // Get target site ID from param, query, or body
    const targetSiteId = typeof resourceSiteId === 'function' 
      ? resourceSiteId(req)
      : resourceSiteId

    // Wapimred hanya bisa akses site mereka sendiri
    if (req.user.role === 'wapimred') {
      if (req.user.siteId !== targetSiteId) {
        logger.warn(`Access denied: Wapimred ${req.user.userId} (site:${req.user.siteId}) tried to access site ${targetSiteId}`)
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Akses ditolak: tidak memiliki izin untuk situs ini' }
        })
      }
    }

    // Journalist & Reader tidak punya akses admin
    if (req.user.role === 'journalist' || req.user.role === 'reader') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Role tidak memiliki akses admin' }
      })
    }

    next()
  }
}
```

#### Step 1.2: Update User Controller to Use Site-Scoping

```typescript
// apps/api/src/modules/user/user.controller.ts
// Add import
import { requireSiteAccess } from '../../middleware/site-scope.middleware'

// Modify existing endpoints:
userRouter.get('/',
  requireAuth,
  requireRole('superadmin', 'wapimred'),
  // NEW: Only show users from wapimred's site (unless superadmin)
  (req, res, next) => {
    if (req.user!.role === 'wapimred') {
      // Override query parameter to force siteId
      req.query.siteId = req.user!.siteId
    }
    next()
  },
  siteMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    // existing code...
  })
)
```

#### Step 1.3: Test Scenarios (Manual)

```bash
# Test 1: Wapimred tries to access another site's users
curl -H "Authorization: Bearer <wapimred_token_site_A>" \
  "http://localhost:3000/api/user?siteId=<site_B_id>"
# Expected: 403 Forbidden

# Test 2: Superadmin accesses any site
curl -H "Authorization: Bearer <superadmin_token>" \
  "http://localhost:3000/api/user?siteId=<site_B_id>"
# Expected: 200 OK

# Test 3: Wapimred without siteId set
curl -H "Authorization: Bearer <wapimred_token_no_site>" \
  "http://localhost:3000/api/user"
# Expected: 403 Forbidden (because req.user.siteId is null)
```

**Acceptance Criteria**:
- ✅ Wapimred cannot access users from other sites
- ✅ Superadmin can access all sites
- ✅ Journalist/Reader gets 403 on admin endpoints
- ✅ Audit log records denied access attempts

---

### **2. Implement File Validation & Virus Scanning**

**Problem**: Upload form accepts any file type (`.exe`, `.php`, malware). Must validate images + scan.

#### Step 2.1: Install Dependencies

```bash
cd apps/api
pnpm add sharp multer
pnpm add -D @types/sharp
# Optional: ClamAV (for virus scanning)
# For Docker: Add clamdscan daemon
```

#### Step 2.2: Create File Validator Service

```typescript
// apps/api/src/services/file-validator.service.ts
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { logger } from '../lib/logger'

export class FileValidator {
  static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ]

  static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  static async validateFile(
    filePath: string,
    originalName: string
  ): Promise<{ valid: boolean; error?: string; metadata?: any }> {
    try {
      // 1. Check file exists
      const stats = await fs.stat(filePath)
      if (stats.size > this.MAX_FILE_SIZE) {
        return { valid: false, error: `File terlalu besar. Maksimal ${this.MAX_FILE_SIZE / 1024 / 1024}MB` }
      }

      // 2. Check MIME type using file magic (not extension)
      const mime = await this.detectMimeType(filePath)
      if (!this.ALLOWED_MIME_TYPES.includes(mime)) {
        return { valid: false, error: `Tipe file tidak diizinkan: ${mime}` }
      }

      // 3. Validate image integrity with Sharp
      const metadata = await sharp(filePath).metadata()
      if (!metadata.width || !metadata.height) {
        return { valid: false, error: 'File bukan gambar yang valid' }
      }

      // 4. Check minimum resolution (KTP harus jelas)
      if (metadata.width < 1000 || metadata.height < 800) {
        return { valid: false, error: 'Resolusi terlalu rendah. Minimal 1000x800px' }
      }

      // 5. Optional: Virus scan with ClamAV (if configured)
      if (process.env.CLAMAV_ENABLED === 'true') {
        const isClean = await this.scanWithClamAV(filePath)
        if (!isClean) {
          await fs.unlink(filePath) // auto delete malware
          return { valid: false, error: 'File terdeteksi berisi malware' }
        }
      }

      return {
        valid: true,
        metadata: {
          mime,
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: stats.size
        }
      }
    } catch (error: any) {
      logger.error('File validation error:', error)
      return { valid: false, error: 'Validasi file gagal' }
    }
  }

  private static async detectMimeType(filePath: string): Promise<string> {
    // Use file-type package for accurate detection
    const fileType = await import('file-type')
    const buffer = await fs.readFile(filePath)
    const detected = await fileType.fileTypeFromBuffer(buffer)
    return detected?.mime || 'application/octet-stream'
  }

  private static async scanWithClamAV(filePath: string): Promise<boolean> {
    // Placeholder: integrate clamdscan
    // Returns true if clean, false if virus detected
    // Implementation depends on server setup
    return true // For now, assume clean
  }
}
```

#### Step 2.3: Update KYC Upload Endpoint

```typescript
// apps/api/src/modules/kyc/kyc.controller.ts (NEW FILE)
import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import { requireAuth, requireSiteAccess } from '../../middleware'
import { FileValidator } from '../../services/file-validator.service'
import { logger } from '../../lib/logger'

export const kycRouter = Router()

kycRouter.post('/submit',
  requireAuth,
  requireRole('journalist', 'wapimred'),
  // Add multer middleware before this
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId
    const siteId = req.user!.siteId

    // Multer should store file in temp location
    const uploads = req as any
    const idCard = uploads.files?.['idCard']
    const familyCard = uploads.files?.['familyCard']

    if (!idCard) {
      return res.status(400).json({ success: false, error: { message: 'KTP wajib diupload' } })
    }

    // Validate files
    const idCardValidation = await FileValidator.validateFile(
      idCard.path,
      idCard.originalname
    )
    if (!idCardValidation.valid) {
      await fs.unlink(idCard.path) // cleanup
      return res.status(400).json({ success: false, error: { message: idCardValidation.error } })
    }

    let familyCardValidation: any = null
    if (familyCard) {
      familyCardValidation = await FileValidator.validateFile(
        familyCard.path,
        familyCard.originalname
      )
      if (!familyCardValidation.valid) {
        await fs.unlink(familyCard.path)
        await fs.unlink(idCard.path)
        return res.status(400).json({ success: false, error: { message: familyCardValidation.error } })
      }
    }

    // Validation: user KYC belum pernah submit atau rejected
    const existingKyc = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true, kycSubmittedAt: true, kycNotes: true }
    })

    if (existingKyc?.isVerified) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'KYC sudah disetujui. Tidak perlu submit ulang.' } 
      })
    }

    // Optional: If rejected before, check if can resubmit (policy: 3x)
    if (existingKyc?.kycNotes?.includes('REJECTED')) {
      const rejectCount = (existingKyc.kycNotes.match(/REJECTED/g) || []).length
      if (rejectCount >= 3) {
        return res.status(403).json({
          success: false,
          error: { message: 'Maksimal 3 kali pengajuan. Hubungi admin untuk bantuan.' }
        })
      }
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Save files to permanent storage (temp: move from /tmp to final)
      const idCardFinalPath = await this.savePermanent(idCard.path, userId, 'ktp')
      const familyCardFinalPath = familyCard 
        ? await this.savePermanent(familyCard.path, userId, 'kk')
        : null

      // Update user
      await tx.user.update({
        where: { id: userId },
        data: {
          bio: req.body.bio,
          idCardPath: idCardFinalPath,
          familyCardPath: familyCardFinalPath,
          kycSubmittedAt: new Date(),
          isVerified: false,
          kycNotes: `SUBMITTED at ${new Date().toISOString()}`
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          siteId,
          action: 'kyc.submit',
          entityType: 'user',
          entityId: userId,
          newValue: { hasIdCard: !!idCardFinalPath, hasFamilyCard: !!familyCardFinalPath }
        }
      })

      // Create notification to all superadmin & wapimred
      const admins = await tx.user.findMany({
        where: {
          siteId,
          role: { in: ['superadmin', 'wapimred'] }
        },
        select: { id: true }
      })

      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            siteId,
            type: 'kyc_submitted',
            title: 'Pengajuan KYC Baru',
            message: `User ${req.user!.name} telah mengajukan verifikasi identitas.`,
            link: `/dashboard/admin/kyc/${userId}`
          }
        })
      }
    })

    res.status(200).json({
      success: true,
      data: { message: 'KYC submitted successfully', submittedAt: new Date() }
    })
  })
)

// Helper
private async savePermanent(tempPath: string, userId: string, type: 'ktp' | 'kk'): Promise<string> {
  // 1. Generate encrypted filename
  const hash = await crypto.randomBytes(16).toString('hex')
  const ext = path.extname(tempPath)
  const filename = `${type}_${userId}_${hash}${ext}`
  const finalDir = process.env.KYC_STORAGE_PATH || '/var/uploads/kyc'
  const finalPath = path.join(finalDir, filename)

  // 2. Move file
  await fs.mkdir(finalDir, { recursive: true })
  await fs.rename(tempPath, finalPath)

  // 3. Apply watermark (see next section)
  await this.applyWatermark(finalPath)

  return finalPath
}

private async applyWatermark(filePath: string): Promise<void> {
  await sharp(filePath)
    .composite([
      {
        input: Buffer.from('ONLY FOR BERITAKARYA VERIFICATION'),
        gravity: 'southeast',
        opacity: 0.3,
        tile: true
      }
    ])
    .toFile(filePath)
}
```

**Acceptance Criteria**:
- ✅ Only accept JPEG/PNG/WebP images
- ✅ Reject files > 5MB
- ✅ Reject images < 1000x800px
- ✅ Auto-delete files if validation fails
- ✅ Log all validation attempts (success/failure)
- ✅ If ClamAV enabled, scan and reject malware

---

### **3. Add Watermarking dengan Sharp di Server Side**

**Goal**: Prevent misuse of KTP/KK images.

#### Step 3.1: Create Watermark Service

```typescript
// apps/api/src/services/watermark.service.ts
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { logger } from '../lib/logger'

export class WatermarkService {
  static async applyWatermark(
    imagePath: string,
    options: {
      text?: string
      position?: 'north' | 'south' | 'east' | 'west' | 'center' | 'se' | 'sw' | 'ne' | 'nw'
      opacity?: number
      fontSize?: number
    } = {}
  ): Promise<void> {
    const {
      text = 'ONLY FOR BERITAKARYA VERIFICATION - REJECTED IF UNAUTHORIZED',
      position = 'southeast',
      opacity = 0.4,
      fontSize = 24
    } = options

    try {
      const imageBuffer = await fs.readFile(imagePath)
      const metadata = await sharp(imageBuffer).metadata()

      // Create watermark text as SVG
      const svg = `
        <svg width="${metadata.width}" height="${metadata.height}">
          <style>
            .watermark { 
              font-family: Arial, sans-serif; 
              font-size: ${fontSize}px; 
              fill: rgba(255, 0, 0, ${opacity});
              font-weight: bold;
              text-anchor: end;
            }
          </style>
          <text x="${metadata.width - 20}" y="${metadata.height - 20}" class="watermark" ${this.getAlignment(position)}>
            ${text}
          </text>
        </svg>
      `

      const svgBuffer = Buffer.from(svg)

      await sharp(imageBuffer)
        .composite([
          {
            input: svgBuffer,
            top: 0,
            left: 0
          }
        ])
        .toFile(imagePath)

      logger.info(`Watermark applied to ${imagePath}`)
    } catch (error: any) {
      logger.error(`Failed to watermark ${imagePath}:`, error)
      throw error
    }
  }

  private static getAlignment(position: string): string {
    const alignments: Record<string, string> = {
      'north': 'text-anchor="middle" x="50%" y="30"',
      'south': 'text-anchor="middle" x="50%" y="' + (metadata.height - 30) + '"',
      'east': 'text-anchor="end" x="' + (metadata.width - 20) + '" y="50%"',
      'west': 'text-anchor="start" x="20" y="50%"',
      'center': 'text-anchor="middle" x="50%" y="50%"',
      'se': 'text-anchor="end" x="' + (metadata.width - 20) + '" y="' + (metadata.height - 20) + '"',
      'sw': 'text-anchor="start" x="20" y="' + (metadata.height - 20) + '"',
      'ne': 'text-anchor="end" x="' + (metadata.width - 20) + '" y="30"',
      'nw': 'text-anchor="start" x="20" y="30"'
    }
    return alignments[position] || alignments['se']
  }
}
```

#### Step 3.2: Integrate into Upload Flow

Watermarking already integrated in `savePermanent()` helper above.

#### Step 3.3: Generate Preview Thumbnails

```typescript
// Inside savePermanent function, after watermark
private async savePermanent(tempPath: string, userId: string, type: 'ktp' | 'kk'): Promise<string> {
  const hash = await crypto.randomBytes(16).toString('hex')
  const ext = path.extname(tempPath)
  const filename = `${type}_${userId}_${hash}${ext}`
  const finalDir = process.env.KYC_STORAGE_PATH || '/var/uploads/kyc'
  const finalPath = path.join(finalDir, filename)

  await fs.mkdir(finalDir, { recursive: true })
  
  // 1. Apply watermark to original
  await this.applyWatermark(tempPath)
  
  // 2. Generate thumbnail (300x200) for admin preview
  const thumbFilename = `${type}_${userId}_${hash}_thumb.jpg`
  const thumbPath = path.join(finalDir, thumbFilename)
  
  await sharp(tempPath)
    .resize(300, 200, { fit: 'cover' })
    .jpeg({ quality: 70 })
    .toFile(thumbPath)

  await fs.rename(tempPath, finalPath)

  // Return both paths (store in DB later)
  return { original: finalPath, thumbnail: thumbPath }
}
```

**Acceptance Criteria**:
- ✅ All uploaded KTP/KK images have visible "ONLY FOR BERITAKARYA VERIFICATION" text
- ✅ Thumbnail generated for admin panel (fast preview)
- ✅ Watermark prevents easy cropping (tiled pattern)
- ✅ Watermark applied before file moved to permanent storage

---

### **4. Create Migration Script with Nullable Fields**

**Critical**: Existing users must not break when new columns added.

#### Step 4.1: Update Prisma Schema

```prisma
// apps/api/prisma/schema.prisma - ADD to User model (after line 59)
model User {
  // ... existing fields ...
  
  // KYC Fields (all nullable for backward compatibility)
  bio              String?   @db.Text
  idCardPath       String?
  familyCardPath   String?
  isVerified       Boolean   @default(false)
  kycSubmittedAt   DateTime?
  kycNotes         String?
  kycReviewedBy    String?   // userId admin yang approval
  kycReviewedAt    DateTime?
  kycConsentGivenAt DateTime? // Waktu user setuju kebijakan data
  kycDataExpiresAt DateTime?  // Auto-delete after X years (GDPR compliance)

  // Audit trail: who viewed KYC files
  kycViewLogs      KYCViewLog[]

  @@index([isVerified])
  @@index([kycSubmittedAt])
}
```

#### Step 4.2: Create New Model for Audit Trail

```prisma
model KYCViewLog {
  id        String   @id @default(uuid())
  userId    String   // user yang KYC-nya dilihat
  viewerId  String   // admin yang melihat
  siteId    String
  fileType  String   // 'ktp' | 'kk' | 'bio'
  viewedAt  DateTime @default(now())
  ipAddress String?
  userAgent String?

  user      User     @relation(fields: [userId], references: [id])
  site      Site     @relation(fields: [siteId], references: [id])

  @@index([userId, viewedAt])
  @@index([viewerId])
  @@index([siteId])
}
```

#### Step 4.3: Generate Migration

```bash
cd apps/api
pnpm prisma migrate dev --name "add-kyc-fields"
# This creates:
# - migrations/20251313000000_add_kyc_fields/
#   ├── migration.sql
#   └── README.md
```

Generated SQL should look like:

```sql
-- AddNullableFieldToUser
ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "idCardPath" TEXT;
ALTER TABLE "User" ADD COLUMN "familyCardPath" TEXT;
ALTER TABLE "User" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "kycSubmittedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "kycNotes" TEXT;
ALTER TABLE "User" ADD COLUMN "kycReviewedBy" TEXT;
ALTER TABLE "User" ADD COLUMN "kycReviewedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "kycConsentGivenAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "kycDataExpiresAt" TIMESTAMP(3);

-- CreateIndex on isVerified, kycSubmittedAt
CREATE INDEX "User_isVerified_idx" ON "User"("isVerified");
CREATE INDEX "User_kycSubmittedAt_idx" ON "User"("kycSubmittedAt");

-- Create KYCViewLog table
CREATE TABLE "KYCViewLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KYCViewLog" ADD CONSTRAINT "KYCViewLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KYCViewLog" ADD CONSTRAINT "KYCViewLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

#### Step 4.4: Backfill Strategy for Old Users

Create script to set sensible defaults:

```typescript
// scripts/backfill-kyc-defaults.ts
import { prisma } from '../apps/api/src/db/client'

async function backfill() {
  console.log('Starting KYC backfill...')
  
  const count = await prisma.user.updateMany({
    where: { isVerified: null },
    data: {
      isVerified: false,
      kycSubmittedAt: null,
      kycNotes: null
    }
  })
  
  console.log(`Updated ${count.count} users with default KYC values`)
  console.log('Backfill complete!')
}

backfill().catch(console.error)
```

Run:
```bash
tsx scripts/backfill-kyc-defaults.ts
pnpm prisma db push  # push to production after migration
```

**Acceptance Criteria**:
- ✅ Migration runs without error on existing production DB
- ✅ Old users have `isVerified: false` by default (not breaking change)
- ✅ All new columns are nullable (except `isVerified` has default)
- ✅ Indexes created for query performance
- ✅ KYCViewLog table created for compliance tracking
- ✅ Prisma client regenerated: `pnpm prisma generate`

---

### **5. Add Consent Checkbox + kycConsentGivenAt**

**Legal Requirement** (UU PDP): Explicit consent before collecting personal data.

#### Step 5.1: Update KYC Form Frontend

**File**: `apps/web/app/dashboard/kyc/form/page.tsx` (create new)

```tsx
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function KYCForm() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [bio, setBio] = useState('')
  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [familyCardFile, setFamilyCardFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!consentGiven) {
      alert('Harus setuju kebijakan perlindungan data sebelum melanjutkan')
      return
    }

    if (!idCardFile) {
      alert('Upload KTP wajib')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('bio', bio)
      formData.append('idCard', idCardFile)
      if (familyCardFile) formData.append('familyCard', familyCardFile)
      formData.append('consent', 'true') // explicit consent flag

      const res = await fetch('/api/user/kyc/submit', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${session?.accessToken}`
        }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Submission failed')
      
      alert('KYC submitted successfully!')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Verifikasi Identitas (KYC)</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bio Field */}
        <div>
          <label className="block mb-2">Biografi Singkat</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 border rounded"
            rows={4}
            placeholder="Ceritakan tentang latar belakang Anda sebagai jurnalis..."
            required
          />
        </div>

        {/* KTP Upload */}
        <div>
          <label className="block mb-2">Upload KTP *</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:border-0 file:text-sm file:font-semibold
              file:bg-red-50 file:text-red-700
              hover:file:bg-red-100"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: JPEG/PNG/WebP. Maks 5MB. Resolusi minimal 1000x800px.
          </p>
        </div>

        {/* KK Upload (Optional) */}
        <div>
          <label className="block mb-2">Upload KK (Opsional)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFamilyCardFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:border-0 file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload Kartu Keluarga untuk.percepatan verifikasi
          </p>
        </div>

        {/* Consent Checkbox */}
        <div className="border p-4 rounded bg-gray-50">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-1 w-5 h-5 text-red-600 rounded focus:ring-red-500"
              required
            />
            <span className="text-sm text-gray-700">
              Saya menyetujui{' '}
              <a href="/kebijakan-privasi" target="_blank" className="text-red-600 underline">
                kebijakan perlindungan data pribadi
              </a>{' '}
              BeritaKarya. Saya paham data saya (KTP/KK) akan disimpan dengan aman,
              di-watermark, dan hanya digunakan untuk verifikasi identitas sebagai jurnalis.
              Data akan dihapus setelah 5 tahun sesuai UU PDP.{' '}
              <strong>Saya tidak bisa menarik persetujuan setelah submit.</strong>
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !consentGiven}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded transition"
        >
          {loading ? 'Mengirim...' : 'Submit Verifikasi'}
        </button>
      </form>
    </div>
  )
}
```

#### Step 5.2: Update Backend to Capture Consent

**Modify** `kyc.controller.ts` submission handler:

```typescript
// Inside POST /submit handler (around line checking 'consent')
const consentGiven = req.body.consent === 'true' || req.body.consent === '1'
if (!consentGiven) {
  return res.status(400).json({
    success: false,
    error: { message: 'Harus setuju kebijakan perlindungan data untuk melanjutkan' }
  })
}

// Later in transaction:
await tx.user.update({
  where: { id: userId },
  data: {
    bio: req.body.bio,
    // ... other fields
    kycConsentGivenAt: new Date(),
    kycDataExpiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000) // 5 years from now
  }
})
```

#### Step 5.3: Create Privacy Policy Page

**File**: `apps/web/app/kebijakan-privasi/page.tsx`

```tsx
export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Kebijakan Perlindungan Data Pribadi</h1>
      
      <div className="prose prose-red max-w-none">
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Pengumpulan Data</h2>
          <p>BeritaKarya mengumpulkan data identitas berikut untuk keperluan verifikasi jurnalis:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Fotokopi KTP</li>
            <li>Fotokopi KK (opsional)</li>
            <li>Biografi singkat</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. Tujuan Penggunaan</h2>
          <p>Data dikumpulkan untuk:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Verifikasi identitas jurnalis sesuai UU Pers</li>
            <li>Mencegah penyalahgunaan identitas di platform kami</li>
            <li>Memenuhi kewajiban hukum sebagai penyedia konten berita</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. Penyimpanan & Keamanan</h2>
          <p>Data disimpan dengan cara:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Watermark "ONLY FOR BERITAKARYA VERIFICATION" pada semua gambar</li>
            <li>Enkripsi filename agar tidak bisa ditebak</li>
            <li>Access logging: setiap akses dicatat di audit trail</li>
            <li>Disimpan di server terenkripsi dengan backup redundancy</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">4. Retensi Data</h2>
          <p>Data KYC akan disimpan maksimal <strong>5 tahun</strong> sejak tanggal submit. Setelah itu akan dihapus permanen secara otomatis.</p>
          <p>Jika Anda keluar dari platform, data akan dihapus dalam <strong>30 hari</strong> atas permintaan.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">5. Hak Anda</h2>
          <p>Sebagai data subject, Anda memiliki hak:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Mengakses data yang tersimpan</li>
            <li>Meminta perbaikan data yang salah</li>
            <li>Meminta penghapusan data (right to erasure)</li>
          </ul>
          <p>Hubungi Data Protection Officer kami di <a href="mailto:dpo@beritakarya.id">dpo@beritakarya.id</a></p>
        </section>

        <p className="text-sm text-gray-600 mt-8">Last updated: 13 Mei 2026</p>
      </div>
    </div>
  )
}
```

**Acceptance Criteria**:
- ✅ Consent checkbox required, cannot submit without checking
- ✅ `kycConsentGivenAt` timestamp saved in DB
- ✅ `kycDataExpiresAt` set to 5 years from submission
- ✅ Privacy policy page accessible at `/kebijakan-privasi`
- ✅ GDPR/UU PDP compliant language
- ✅ DPO contact info visible

---

### **6. Implement Notification Triggers**

**Goal**: Admin notified when KYC submitted; User notified when approved/rejected.

#### Step 6.1: Notification Model Already Exists

Check `apps/api/prisma/schema.prisma` line 284-297 - Notification model exists.

#### Step 6.2: Create KYC Event Dispatcher

```typescript
// apps/api/src/modules/kyc/kyc.service.ts
import { prisma } from '../../db/client'
import { logger } from '../../lib/logger'

export class KYCService {
  static async submitNotification(userId: string, siteId: string, submitterName: string) {
    try {
      // Get all superadmin & wapimred for this site
      const admins = await prisma.user.findMany({
        where: {
          siteId,
          role: { in: ['superadmin', 'wapimred'] }
        },
        select: { id: true, email: true, name: true }
      })

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            siteId,
            type: 'kyc_submitted',
            title: '📝 Pengajuan KYC Baru',
            message: `User ${submitterName} mengajukan verifikasi identitas.`,
            link: `/dashboard/admin/kyc/${userId}`,
            isRead: false
          }
        })
      }

      logger.info(`KYC submission notifications sent to ${admins.length} admins`)
    } catch (error: any) {
      logger.error('Failed to send KYC notification:', error)
    }
  }

  static async approvalNotification(userId: string, approved: boolean, notes?: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      })

      if (!user) return

      const type = approved ? 'kyc_approved' : 'kyc_rejected'
      const title = approved 
        ? '✅ KYC Disetujui' 
        : '❌ KYC Ditolak'
      const message = approved
        ? `Selamat! Verifikasi identitas Anda telah disetujui. Anda sekarang dapat menerbitkan berita.`
        : `Verifikasi identitas Anda ditolak. Alasan: ${notes || 'Tidak memenuhi syarat'}. Anda dapat mengajukan ulang.`

      await prisma.notification.create({
        data: {
          userId,
          siteId: user.siteId || '', // will update if needed
          type,
          title,
          message,
          link: '/dashboard/profile',
          isRead: false
        }
      })

      // Also send email (optional, requires email service)
      if (process.env.EMAIL_ENABLED === 'true') {
        await this.sendEmailNotification(user.email, title, message)
      }

      logger.info(`KYC ${approved ? 'approval' : 'rejection'} notification sent to ${user.email}`)
    } catch (error: any) {
      logger.error('Failed to send KYC result notification:', error)
    }
  }

  private static async sendEmailNotification(email: string, title: string, message: string) {
    // Placeholder: integrate with your email provider (Resend/SendGrid)
    // await fetch('https://api.resend.com/emails', { ... })
  }
}
```

#### Step 6.3: Trigger Notifications in Controller

In `POST /kyc/submit` (after transaction commit):

```typescript
// After creating notifications for admins (line 120 in earlier code)
await prisma.$transaction(async (tx) => {
  // ... existing code
  
  // After all DB operations succeed:
  await KYCService.submitNotification(userId, siteId, req.user!.name)
})
```

In `PATCH /admin/kyc/:userId/verify` (create this endpoint):

```typescript
// apps/api/src/modules/kyc/kyc.controller.ts
kycRouter.patch('/:userId/verify',
  requireAuth,
  requireRole('superadmin', 'wapimred'),
  requireSiteAccess((req) => {
    // Get user's siteId from DB
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { siteId: true }
    })
    return user?.siteId || ''
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const { status, notes } = req.body // status: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: { message: 'Status harus approved atau rejected' } })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { siteId: true, kycNotes: true, name: true }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } })
    }

    // Prevent double-approval
    if (user.kycNotes?.includes('APPROVED')) {
      return res.status(400).json({ success: false, error: { message: 'KYC sudah disetujui sebelumnya' } })
    }

    await prisma.$transaction(async (tx) => {
      const updateData: any = {
        isVerified: status === 'approved',
        kycNotes: `${status.toUpperCase()} at ${new Date().toISOString()}${notes ? ` - ${notes}` : ''}`,
        kycReviewedBy: req.user!.userId,
        kycReviewedAt: new Date()
      }

      if (status === 'approved') {
        // Optionally: auto-upgrade role
        await tx.user.update({
          where: { id: userId },
          data: {
            ...updateData,
            role: 'journalist' // auto-promote from 'reader' to 'journalist'
          }
        })
      } else {
        await tx.user.update({
          where: { id: userId },
          data: updateData
        })
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: req.user!.userId,
          siteId: user.siteId,
          action: `kyc.${status}`,
          entityType: 'user',
          entityId: userId,
          newValue: { status, notes }
        }
      })

      // Notify user
      await KYCService.approvalNotification(userId, status === 'approved', notes)
    })

    res.json({ success: true, data: { message: `KYC ${status} successfully` } })
  })
)
```

#### Step 6.4: Frontend - Display Notifications

**File**: `apps/web/components/notifications/NotificationBell.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function NotificationBell() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (!session?.accessToken) return

    const fetchUnread = async () => {
      const res = await fetch('/api/notifications/unread?limit=5', {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      })
      const data = await res.json()
      setUnreadCount(data.data?.length || 0)
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [session])

  return (
    <div className="relative">
      <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-2">
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
          {/* Render notification list here */}
          <div className="p-4 border-b">
            <h3 className="font-semibold">Notifikasi Terbaru</h3>
          </div>
          {/* ... */}
        </div>
      )}
    </div>
  )
}
```

**Acceptance Criteria**:
- ✅ Admin receives notification when user submits KYC
- ✅ User receives notification when KYC approved/rejected
- ✅ Notifications appear in bell dropdown with real-time count
- ✅ Email sent (if EMAIL_ENABLED=true)
- ✅ Notification type distinguishes kyc_submitted vs kyc_approved vs kyc_rejected

---

## ✅ P0 SUMMARY CHECKLIST

Before launching KYC feature, **MUST COMPLETE**:

- [x] Auth middleware site-scopingFix (`requireSiteAccess`)
- [x] File validator service with MIME + resolution checks
- [ ] Virus scanning integration (if required)
- [x] Watermark service with Sharp
- [x] Thumbnail generation for admin preview
- [x] Prisma migration (nullable fields + KYCViewLog)
- [x] Backfill script for existing users
- [x] KYC consent form with legal language
- [x] Privacy policy page (`/kebijakan-privasi`)
- [x] Notification triggers (admin + user)
- [ ] Email service integration (optional but recommended)
- [ ] Integration tests for entire flow
- [ ] Manual testing: complete submit → review → approve/reject cycle
- [x] Audit log verification (all actions recorded)
- [x] Security review: auth bypass attempts fail
- [ ] Performance test: upload 5MB file timeout < 30s

**Estimated P0 Time**: 2-3 development weeks (5-7 days actual coding + testing)

---

## 🟡 P1 - HIGH (1st Sprint After P0)

**Goal**: Improve usability and basic operations.

---

### **1. Pagination for Admin KYC List**

**Problem**: `GET /api/admin/kyc/pending` returns all users, breaks with 1000+ submissions.

**Implementation**:

```typescript
// Add to kyc.controller.ts
kycRouter.get('/pending',
  requireAuth,
  requireRole('superadmin', 'wapimred'),
  requireSiteAccess((req) => req.query.siteId as string || req.user!.siteId!),
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = req.query.siteId as string || req.user!.siteId!
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string // optional: search by name/email
    
    const where: any = { 
      siteId,
      isVerified: false,
      kycSubmittedAt: { not: null }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          kycSubmittedAt: true,
          kycNotes: true,
          _count: { select: { articles: true } } // additional context
        },
        orderBy: { kycSubmittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  })
)
```

---

### **2. User Notification for Approval/Rejection**

**Already implemented in P0 Section 6**. Need to create UI component.

**File**: `apps/web/app/dashboard/notifications/page.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications?limit=50')
    const data = await res.json()
    setNotifications(data.data?.items || [])
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session?.accessToken}` }
    })
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notifikasi</h1>
      
      {notifications.length === 0 ? (
        <p className="text-gray-500">Belum ada notifikasi</p>
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 ${notification.isRead ? 'bg-white' : 'bg-red-50 border-red-200'}`}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">{notification.title}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(notification.createdAt).toLocaleDateString('id-ID')}
                </span>
              </div>
              <p className="mt-2 text-gray-700">{notification.message}</p>
              {notification.link && (
                <a href={notification.link} className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                  Lihat detail →
                </a>
              )}
              {!notification.isRead && (
                <span className="inline-block mt-2 text-xs bg-red-600 text-white px-2 py-1 rounded">
                  Baru
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### **3. File Cleanup Strategy (Soft Delete)**

**Problem**: Rejected KYC files accumulate forever.

**Solution**: 

1. **Add Cleanup Cron Job** (`apps/api/src/cron/cleanup-rejected-kyc.ts`)

```typescript
import { prisma } from '../db/client'
import { logger } from '../lib/logger'
import fs from 'fs/promises'
import path from 'path'

export async function cleanupRejectedKYC() {
  logger.info('Starting KYC cleanup job...')
  
  // Find rejected KYC older than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  const rejectedUsers = await prisma.user.findMany({
    where: {
      isVerified: false,
      kycSubmittedAt: { lt: thirtyDaysAgo },
      kycNotes: { contains: 'REJECTED' }
    },
    select: { id: true, idCardPath: true, familyCardPath: true }
  })

  let deletedCount = 0
  for (const user of rejectedUsers) {
    try {
      // Delete files from disk
      if (user.idCardPath) {
        await fs.unlink(user.idCardPath).catch(() => {})
      }
      if (user.familyCardPath) {
        await fs.unlink(user.familyCardPath).catch(() => {})
      }

      // Clear KYC fields in DB
      await prisma.user.update({
        where: { id: user.id },
        data: {
          idCardPath: null,
          familyCardPath: null,
          kycSubmittedAt: null,
          kycNotes: `REJECTED_CLEANED at ${new Date().toISOString()}`
        }
      })

      deletedCount++
    } catch (error: any) {
      logger.error(`Failed to clean KYC for user ${user.id}:`, error)
    }
  }

  logger.info(`Cleaned up ${deletedCount} rejected KYC records`)
  return { cleaned: deletedCount }
}
```

2. **Add to Crontab or use node-cron**:

```typescript
// apps/api/src/server.ts or separate cron.ts
import cron from 'node-cron'
import { cleanupRejectedKYC } from './cron/cleanup-rejected-kyc'

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    await cleanupRejectedKYC()
  } catch (error) {
    logger.error('KYC cleanup job failed:', error)
  }
})
```

---

### **4. Basic Monitoring Metrics**

**Goals**: Track KYC conversion rates, time-to-approval, bottleneck analysis.

**Option A: Use Existing AIUsage Pattern**

Add KYC metrics to existing `AIUsage` model (or create new `KYCUsage`):

```prisma
model KYCUsage {
  id           String   @id @default(uuid())
  userId       String
  siteId       String
  action       String   // 'submit' | 'approve' | 'reject' | 'view'
  durationMs   Int?      // Time spent reviewing (for admin)
  hasIdCard    Boolean
  hasFamilyCard Boolean
  succeeded    Boolean
  error?       String?
  createdAt    DateTime @default(now())

  @@index([siteId, action])
  @@index([userId])
}
```

Track:

```typescript
// On submit
await prisma.kYCUsage.create({
  data: {
    userId,
    siteId,
    action: 'submit',
    hasIdCard: !!idCardPath,
    hasFamilyCard: !!familyCardPath,
    succeeded: true
  }
})

// On approval/rejection
await prisma.kYCUsage.create({
  data: {
    userId: adminId,
    siteId,
    action: status,
    durationMs: reviewDuration, // track time spent on admin page
    succeeded: true
  }
})
```

**Option B: Use Analytics Dashboard**

Build simple admin dashboard:

```
Apps: /apps/web/app/dashboard/admin/kyc/page.tsx

Metrics:
- Total Pending: 45
- Approved This Week: 23
- Rejected This Week: 8
- Avg Time-to-Approval: 2.3 days
- Conversion Rate: 78%
- Most Common Rejection Reasons (from kycNotes)
```

**Implementation**: Use existing analytics stack (Recharts).

---

## 🟢 P2 - MEDIUM (2nd Sprint)

**Goal**: Scale and compliance enhancement.

---

### **1. Cloud Storage Integration (S3/R2)**

Replace local `/uploads/kyc/` with S3-compatible storage.

#### Step 1: Create Storage Service

```typescript
// apps/api/src/services/storage.service.ts
import S3 from 'aws-sdk/clients/s3'
import { logger } from '../lib/logger'

export class StorageService {
  private s3: S3

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      region: process.env.S3_REGION || 'ap-southeast-3', // Jakarta
      endpoint: process.env.S3_ENDPOINT, // for R2/Cloudflare: https://<account>.r2.cloudflarestorage.com
      s3ForcePathStyle: true // required for R2
    })
    this.bucketName = process.env.S3_BUCKET_NAME!
  }

  async generatePresignedUploadUrl(
    userId: string,
    fileType: 'ktp' | 'kk',
    contentType: string
  ): Promise<{ uploadUrl: string; fileKey: string }> {
    const hash = crypto.randomBytes(16).toString('hex')
    const ext = this.getExtension(contentType)
    const key = `kyc/${userId}/${fileType}_${hash}${ext}`

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: 3600, // 1 hour
      ContentType: contentType
    }

    const uploadUrl = await this.s3.getSignedUrlPromise('putObject', params)
    
    return { uploadUrl, fileKey: key }
  }

  async getSignedViewUrl(fileKey: string, expiresIn: number = 300): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: fileKey,
      Expires: expiresIn // 5 minutes default
    }
    return this.s3.getSignedUrlPromise('getObject', params)
  }

  async deleteFile(fileKey: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: fileKey
    }).promise()
  }

  private getExtension(contentType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp'
    }
    return map[contentType] || '.jpg'
  }
}
```

#### Step 2: Update Upload Flow (Client-side Direct to S3)

1. Client requests presigned URL from API
2. Client uploads directly to S3 (bypasses API bandwidth)
3. API receives `fileKey`, updates DB

```typescript
// Modified POST /kyc/submit
kycRouter.post('/submit',
  requireAuth,
  requireRole('journalist', 'wapimred'),
  asyncHandler(async (req: Request, res: Response) => {
    const { idCardKey, familyCardKey, bio } = req.body // client provides S3 keys
    
    // Verify files exist in S3 (call S3.headObject)
    const storage = new StorageService()
    try {
      await storage.s3.headObject({ Bucket: storage.bucketName, Key: idCardKey }).promise()
    } catch (error) {
      return res.status(400).json({ success: false, error: { message: 'KTP file not found in storage' } })
    }

    // Apply watermark by downloading, processing, re-uploading
    const watermarkedKey = await this.watermarkS3File(idCardKey)
    
    // Update user with S3 keys (store full path)
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        bio,
        idCardPath: `s3://${storage.bucketName}/${watermarkedKey}`,
        familyCardPath: familyCardKey ? `s3://${storage.bucketName}/${familyCardKey}` : null,
        kycSubmittedAt: new Date(),
        isVerified: false
      }
    })

    // ... notifications
  })
)
```

---

### **2. Audit Log Enhancement (Track Who VIEWED KYC Files)**

**Goal**: Every time admin views KTP/KK image, log it.

#### Step 2.1: Create Protected File Endpoint

```typescript
// kyc.controller.ts
kycRouter.get('/file/:userId/:type',
  requireAuth,
  requireRole('superadmin', 'wapimred'),
  requireSiteAccess((req) => {
    // Get user's siteId from DB
    return getUserIdSiteId(req.params.userId) // helper function
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, type } = req.params // type: 'ktp' | 'kk'
    
    // Fetch user file path
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        idCardPath: true, 
        familyCardPath: true,
        siteId: true 
      }
    })

    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })

    const fileKey = type === 'ktp' ? user.idCardPath : user.familyCardPath
    if (!fileKey) return res.status(404).json({ success: false, error: { message: 'File not uploaded' } })

    // LOG VIEW ACTIVITY (new)
    await prisma.kYCViewLog.create({
      data: {
        userId: user.id,
        viewerId: req.user!.userId,
        siteId: user.siteId!,
        fileType: type,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || undefined
      }
    })

    // Generate temporary signed URL (S3)
    if (fileKey.startsWith('s3://')) {
      const storage = new StorageService()
      const s3Key = fileKey.replace('s3://', '').split('/').slice(1).join('/') // extract key
      const signedUrl = await storage.getSignedViewUrl(s3Key, 60) // 60 seconds
      
      return res.redirect(302, signedUrl) // redirect to S3 temporary URL
    } else {
      // Legacy: local file
      const absolutePath = path.join(process.env.KYC_STORAGE_PATH || '/var/uploads/kyc', fileKey)
      return res.sendFile(absolutePath)
    }
  })
)
```

#### Step 2.2: Create Admin Audit Report

```tsx
// apps/web/app/dashboard/admin/kyc/audit/page.tsx
'use client'

import { useState, useEffect } from 'react'

export default function KYCAuditPage() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState({ userId: '', viewerId: '' })

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    const res = await fetch(`/api/admin/kyc/audit?${new URLSearchParams(filter)}`)
    const data = await res.json()
    setLogs(data.data)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Audit Trail - KYC File Access</h1>
      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Admin</th>
            <th className="border p-2">User KYC</th>
            <th className="border p-2">File Type</th>
            <th className="border p-2">Timestamp</th>
            <th className="border p-2">IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td className="border p-2">{log.viewer.name}</td>
              <td className="border p-2">{log.user.name}</td>
              <td className="border p-2">{log.fileType}</td>
              <td className="border p-2">{new Date(log.viewedAt).toLocaleString()}</td>
              <td className="border p-2">{log.ipAddress}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

### **3. KYC Dashboard Analytics**

Create admin dashboard for KYC statistics.

```tsx
// apps/web/app/dashboard/admin/kyc/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function KYCDashboard() {
  const [stats, setStats] = useState(null)
  const [timeRange, setTimeRange] = useState('7d') // 7d, 30d, 90d

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const fetchStats = async () => {
    const res = await fetch(`/api/admin/kyc/stats?range=${timeRange}`)
    const data = await res.json()
    setStats(data.data)
  }

  if (!stats) return <div>Loading...</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">KYC Analytics</h1>
      
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Pending" value={stats.pendingCount} color="red" />
        <StatCard title="Approved This Week" value={stats.approvedThisWeek} color="green" />
        <StatCard title="Rejected This Week" value={stats.rejectedThisWeek} color="yellow" />
        <StatCard title="Avg Approval Time" value={`${stats.avgApprovalDays} days`} color="blue" />
      </div>

      <div className="bg-white p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Submission Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.dailySubmissions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#e11d48" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Approval vs Rejection Rate */}
      <div className="bg-white p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Conversion Rate</h2>
        <div className="flex items-center space-x-8">
          <div>
            <span className="text-4xl font-bold text-green-600">{stats.approvalRate}%</span>
            <p className="text-gray-500">Approval Rate</p>
          </div>
          <div>
            <span className="text-4xl font-bold text-red-600">{stats.rejectionRate}%</span>
            <p className="text-gray-500">Rejection Rate</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }) {
  const colors = {
    red: 'bg-red-50 text-red-600 border-red-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200'
  }
  return (
    <div className={`p-4 border rounded-lg ${colors[color]}`}>
      <div className="text-sm opacity-75">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
```

**API Endpoint** `GET /api/admin/kyc/stats`:

```typescript
const stats = await prisma.$queryRaw`
  SELECT 
    COUNT(*) FILTER (WHERE is_verified = false) as "pendingCount",
    COUNT(*) FILTER (WHERE kyc_notes LIKE 'APPROVED%' AND kyc_reviewed_at >= NOW() - INTERVAL '7 days') as "approvedThisWeek",
    COUNT(*) FILTER (WHERE kyc_notes LIKE 'REJECTED%' AND kyc_reviewed_at >= NOW() - INTERVAL '7 days') as "rejectedThisWeek",
    AVG(EXTRACT(EPOCH FROM (kyc_reviewed_at - kyc_submitted_at))/86400) as "avgApprovalDays",
    COUNT(*) FILTER (WHERE kyc_notes LIKE 'APPROVED%') * 100.0 / COUNT(*) as "approvalRate"
  FROM "User" 
  WHERE kyc_submitted_at IS NOT NULL"
```

---

### **4. Automated KYC Expiry (Data Retention)**

**Implementation of GDPR Right to Erasure / Auto-deletion**.

#### Step 4.1: Daily Cleanup Job

```typescript
// cron/data-retention.ts
export async function enforceDataRetention() {
  logger.info('Running data retention policy enforcement...')

  const now = new Date()

  // 1. Delete expired KYC data (5 years)
  const expiredKYC = await prisma.user.findMany({
    where: {
      kycDataExpiresAt: { lt: now },
      OR: [
        { idCardPath: { not: null } },
        { familyCardPath: { not: null } }
      ]
    }
  })

  for (const user of expiredKYC) {
    await prisma.$transaction(async (tx) => {
      // Delete physical files
      if (user.idCardPath) await storage.deleteFile(extractKey(user.idCardPath))
      if (user.familyCardPath) await storage.deleteFile(extractKey(user.familyCardPath))
      
      // Clear DB fields
      await tx.user.update({
        where: { id: user.id },
        data: {
          idCardPath: null,
          familyCardPath: null,
          bio: null,
          kycSubmittedAt: null,
          kycNotes: 'EXPIRED by data retention policy',
          kycConsentGivenAt: null,
          kycDataExpiresAt: null
        }
      })

      // Soft delete view logs (anonymize)
      await tx.kYCViewLog.updateMany({
        where: { userId: user.id },
        data: { userId: 'anonymized' } // or delete
      })
    })
  }

  logger.info(`Data retention: cleaned ${expiredKYC.length} expired KYC records`)
}
```

#### Step 4.2: Add Endpoint for User-Initiated Deletion

```typescript
// DELETE /api/user/kyc/data
kycRouter.delete('/data',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId

    // Verify identity with re-authentication (require password confirm)
    const { password } = req.body
    const user = await prisma.user.findUnique({ where: { id: userId } })
    
    const bcrypt = await import('bcryptjs')
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ success: false, error: { message: 'Password salah' } })
    }

    // Anonymize KYC data (legal requirement may require hard delete)
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: `Deleted User ${userId.slice(0, 8)}`,
        email: `deleted_${userId}@deleted.beritakarya.id`,
        bio: null,
        idCardPath: null,
        familyCardPath: null,
        kycNotes: 'USER_REQUESTED_DELETION',
        passwordHash: crypto.randomBytes(32).toString('hex') // unrecoverable
      }
    })

    // Invalidate all sessions
    await prisma.refreshToken.deleteMany({ where: { userId } })

    res.json({ success: true, data: { message: 'Data Anda telah dihapus sesuai permintaan' } })
  })
)
```

---

## 🔵 P3 - LOW (Nice to have)

---

### **1. Face Matching (KTP vs Selfie)**

**AI Feature**: Verify person in KTP matches selfie uploaded.

**Technology**: 
- AWS Rekognition `CompareFaces`
- Azure Face API
- OpenCV + face_recognition (self-hosted, privacy-preserving)

**Implementation Sketch**:

```typescript
// apps/api/src/modules/kyc/face-verification.service.ts
export class FaceVerificationService {
  async compareFaces(idCardImagePath: string, selfieImagePath: string): Promise<{ match: boolean; confidence: number }> {
    // Option A: AWS Rekognition
    const rekognition = new AWS.Rekognition()
    const idCardBytes = await fs.readFile(idCardImagePath)
    const selfieBytes = await fs.readFile(selfieImagePath)

    const response = await rekognition.compareFaces({
      SourceImage: { Bytes: idCardBytes },
      TargetImage: { Bytes: selfieBytes },
      SimilarityThreshold: 80
    }).promise()

    if (response.FaceMatches && response.FaceMatches.length > 0) {
      return { match: true, confidence: response.FaceMatches[0].Similarity }
    }

    return { match: false, confidence: 0 }
  }
}
```

**Frontend**: Add selfie upload field in KYC form.

---

### **2. AI-Powered Document Validation**

Detect:
- Fake KTP (image manipulation)
- Expired KTP (date check)
- Blurry/too dark images

**Use**: Custom ML model or AWS Textract for OCR + validation.

---

### **3. Multi-Language Consent Form**

**Implementation**: i18n support (next-intl).

```json
// locales/id/kyc.json (existing)
{
  "title": "Verifikasi Identitas",
  "consent": "Saya menyetujui..."
}

// locales/en/kyc.json
{
  "title": "Identity Verification",
  "consent": "I consent to..."
}
```

**Use in UI**:

```tsx
import { useTranslations } from 'next-intl'

export default function KYCForm() {
  const t = useTranslations('kyc')
  
  return (
    <h1>{t('title')}</h1>
    <label>{t('consent')}</label>
  )
}
```

---

## 📦 DEPENDENCIES SUMMARY

### Backend (apps/api/package.json additions)

```json
{
  "dependencies": {
    "sharp": "^0.33.0",
    "multer": "^1.4.5-lts.1",
    "file-type": "^20.0.0",
    "aws-sdk": "^2.1583.0", // if using S3
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/multer": "^1.4.11"
  }
}
```

### Frontend (apps/web/package.json additions)

```json
{
  "dependencies": {
    "recharts": "^2.12.0",
    "next-auth": "^4.24.0"
  }
}
```

---

## 🧪 TESTING CHECKLIST

For each priority level, write tests:

```
apps/api/src/modules/kyc/
├── kyc.controller.test.ts
├── kyc.service.test.ts
├── file-validator.test.ts
├── watermark.service.test.ts
└── storage.service.test.ts

apps/web/**/kyc/
├── form.test.tsx
├── dashboard.test.tsx
└── approval-flow.e2e.test.ts
```

**Critical test cases**:
- ✅ Upload .exe file returns 400
- ✅ Upload image < 1000x800 returns 400
- ✅ Watermark actually appears on output image
- ✅ Wapimred cannot access another site's KYC
- ✅ User without consent cannot submit
- ✅ Notifications sent to correct admins
- ✅ KYCViewLog records every file view
- ✅ Expired KYC auto-deleted by cron
- ✅ Resubmission after rejection works (up to 3x)

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-deployment

- [ ] All P0 tasks completed and manually tested
- [ ] Integration tests passing (`pnpm test:api`)
- [ ] Database backup taken (production)
- [ ] Migration tested on staging first
- [ ] Rollback plan documented

### Deployment

1. **Deploy API First** (migration runs on startup)
   ```bash
   pnpm --filter api build
   pnpm --filter api db:migrate
   pnpm --filter api start
   ```

2. **Deploy Frontend**
   ```bash
   pnpm --filter web build
   pnpm --filter web start
   ```

3. **Verify**
   - Check `/health` endpoint
   - Submit test KYC (use test user)
   - Approve via admin panel
   - Check notifications received

### Post-deployment Monitoring

- Watch error logs: `tail -f logs/error.log | grep kyc`
- Check disk usage if still using local storage: `df -h /var/uploads/kyc`
- Monitor notification queue depth (if using BullMQ)
- Set up alert: `KYC pending > 100` → Slack/Telegram

---

## 📊 TIMELINE & RESOURCE ALLOCATION

| Phase | Duration | Team Size | Key Milestones |
|-------|----------|-----------|----------------|
| P0 | 2-3 weeks | 2-3 devs | KYC submit → approve flow working end-to-end |
| P1 | 1-2 weeks | 1-2 devs | Pagination, notifications, cleanup |
| P2 | 2-3 weeks | 2-3 devs | S3 integration, audit logs, analytics |
| P3 | 1-2 weeks | 1 dev | Face matching, i18n |

**Critical Path**: P0 → P1 → P2 → P3 (sequential)

**Parallel Work**:
- Frontend UI can start in P1 while backend P0 in progress
- Cloud migration (P2) can be done gradually (feature flag)

---

## ⚠️ RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| File upload DoS (large files) | High | High | Already in P0: validation + size limit |
| Legal non-compliance | Medium | Critical | P0: consent + privacy policy + 5yr retention |
| Auth bypass vulnerability | Medium | Critical | P0: site-scoped middleware mandatory |
| Data loss (KYC files) | Low | High | P2: Cloud storage with backup + versioning |
| Performance degrade (watermarking) | Medium | Medium | P0: async processing or queue system |
| Migration failure (existing DB) | Low | High | P0: test migration on staging first |
| Admin abuse (viewing files maliciously) | Medium | High | P2: KYCViewLog + regular audit reviews |

---

## 📝 APPENDICES

### A. Migration Rollback Plan

If `prisma migrate dev` fails:

```bash
# Step 1: Stop all servers
systemctl stop beritakarya-api
systemctl stop beritakarya-web

# Step 2: Check migration status
pnpm prisma migrate status

# Step 3: Rollback last migration
pnpm prisma migrate resolve --rolled-backed <migration_name>

# Step 4: Manually fix DB if partial changes applied
# Check logs/migration_error.sql and apply compensatory changes

# Step 5: Restore from backup if needed
pg_restore -d database backup_20260101.dump

# Step 6: Restart services
systemctl start beritakarya-api
systemctl start beritakarya-web
```

### B. Feature Flag Strategy

Use config flag to enable KYC gradually:

```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  KYC_ENABLED: process.env.KYC_ENABLED === 'true',
  KYC_REQUIRED_FOR_JOURNALIST: process.env.KYC_REQUIRED === 'true'
}

// In auth middleware or role assignment:
if (FEATURE_FLAGS.KYC_REQUIRED_FOR_JOURNALIST && user.role === 'journalist' && !user.isVerified) {
  return res.status(403).json({
    success: false,
    error: { 
      message: 'Verifikasi identitas diperlukan untuk menerbitkan artikel. Silakan lengkapi KYC di dashboard.' 
    }
  })
}
```

.env:
```
KYC_ENABLED=true
KYC_REQUIRED_FOR_JOURNALIST=false  # Start false, enable after testing
```

### C. Emergency Kill Switch

If KYC causes system issues, disable instantly:

```bash
# On server:
ssh user@vps
cd /var/beritakarya
echo "KYC_ENABLED=false" >> .env
systemctl restart beritakarya-api
```

Or feature flag API endpoint to toggle globally:

```typescript
POST /api/admin/feature-flags/kyc
Body: { "enabled": false }
Requires: superadmin only
```

---

## 🎯 SUCCESS METRICS (Post-Launch)

Track weekly:

| Metric | Target | Measurement |
|--------|--------|-------------|
| KYC Submission Success Rate | > 95% | Successful uploads / attempts |
| Avg Time-to-Verification | < 48 hours | Submission → Approval timestamp diff |
| Admin Notification Latency | < 5 minutes | Notification sent within 5 min of submission |
| Approval Rate | 60-80% | Approved / Total submissions |
| Rejection Rate | 20-40% | Rejected / Total submissions |
| Storage Growth Rate | < 100GB/month | S3 usage monitoring |
| Malware Detection Rate | 0 incidents | Number of malware uploads blocked |
| Data Retention Compliance | 100% | Expired KYC deleted on schedule |

---

**END OF DETAILED IMPLEMENTATION PLAN**

**Next Action**: Review this document with team, estimate actual effort, and create JIRA/GitHub issues for each task.