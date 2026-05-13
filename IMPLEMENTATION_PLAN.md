# Implementation Plan: Multi-Tenant Category Inheritance & Superadmin Dashboard
**Project**: BeritaKarya  
**Created**: May 13, 2026  
**Status**: Approved - Ready for Development  
**Timeline**: 3 Weeks  

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Decisions](#architecture-decisions)
3. [Phase 1: Database Schema](#phase-1-database-schema)
4. [Phase 2: Backend Services](#phase-2-backend-services)
5. [Phase 3: Frontend Dashboard](#phase-3-frontend-dashboard)
6. [Phase 4: API Endpoints](#phase-4-api-endpoints)
7. [Deployment & Migration](#deployment--migration)
8. [Testing Strategy](#testing-strategy)
9. [Rollback Plan](#rollback-plan)

---

## Executive Summary

### Goals
1. Implement **category inheritance**: 4 fixed global categories from pusat + 2-3 custom per cabang
2. Enable **integrated superadmin dashboard** within existing `/[site]/dashboard` structure
3. Maintain **single-site journalist model** (no changes needed)
4. Keep **existing VPS infrastructure** (no cloud migration required)

### Scope
- **Database**: Add `siteId` (nullable) + `isGlobal` (boolean) to Category table
- **Backend**: Update Category service, add Sites API endpoints
- **Frontend**: Build admin dashboard page, enhance categories & users pages
- **Infrastructure**: Zero changes to Docker/Nginx/VPS setup

### Effort Estimate
- **Development**: 2-3 weeks (1 developer)
- **Testing**: 3-5 days
- **Deployment**: 1 day (including DB migration)

---

## Architecture Decisions

### ✅ Decision 1: Category Inheritance Model
**Approach**: Nullable `siteId` + `isGlobal` flag  
**Rationale**: 
- Simple queries (no joins)
- Automatic inheritance (global categories visible to all sites)
- Easy onboarding for new sites

**Table Structure**:
```sql
Category:
- id (PK)
- siteId (FK to Site, nullable)
- isGlobal (boolean, default false)
- name, slug, description
- createdAt, updatedAt
```

**Query Pattern**:
```sql
-- Site-specific categories + global categories
SELECT * FROM "Category" 
WHERE "siteId" = $siteId OR "isGlobal" = true
ORDER BY createdAt;
```

### ✅ Decision 2: User Multi-Site Support
**Approach**: Single-site only (current model)  
**Rationale**: 
- Simpler auth model
- Clear personnel boundaries (pusat vs cabang)
- Migration to multi-site can be done later if needed

**Validation Rule**: `siteId` is **required** for roles `journalist` and `wapimred`

### ✅ Decision 3: Superadmin Dashboard Location
**Approach**: Integrated at `/[site]/dashboard/admin`  
**Rationale**: 
- Reuses existing layout & navigation
- Single codebase for all dashboard pages
- Site selector provides "All Sites" view

**Route Protection**: Superadmin-only middleware

---

## Phase 1: Database Schema

### 1.1 Prisma Schema Update

**File**: `packages/config/prisma/schema.prisma` (or wherever your schema lives)

```prisma
model Category {
  id          String   @id @default(cuid())
  siteId      String?  @map("site_id")
  site        Site?     @relation(fields: [siteId], references: [id])
  name        String
  slug        String
  isGlobal    Boolean  @default(false) @map("is_global")
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([slug, siteId]) // Allows (slug, NULL) for global
  @@index([siteId])
  @@index([isGlobal])
}
```

**Important**: The unique constraint `(slug, siteId)` allows:
- One global category with slug "nasional" (siteId=NULL)
- Multiple site-specific "nasional" (siteId='surabaya', siteId='bandung')

### 1.2 Migration SQL

**Create migration file**: `prisma/migrations/20250113_add_category_inheritance/migration.sql`

```sql
-- Add new columns
ALTER TABLE "Category" 
  ADD COLUMN "siteId" TEXT NULL REFERENCES "Site"(id) ON DELETE CASCADE,
  ADD COLUMN "isGlobal" BOOLEAN DEFAULT FALSE;

-- Backfill: existing categories become global (assuming they are pusat categories)
UPDATE "Category" SET "isGlobal" = true WHERE "siteId" IS NULL;

-- Create indexes for performance
CREATE INDEX "Category_siteId_idx" ON "Category"("siteId");
CREATE INDEX "Category_isGlobal_idx" ON "Category"("isGlobal");

-- Composite unique index (partial index for site-specific)
CREATE UNIQUE INDEX "Category_slug_site_unique" 
  ON "Category"(slug, siteId) WHERE siteId IS NOT NULL;

-- Optional: Partial unique index for global slugs (if you want slugs globally unique)
-- CREATE UNIQUE INDEX "Category_slug_global_unique" 
--   ON "Category"(slug) WHERE siteId IS NULL AND isGlobal = true;
```

**Generate & Apply**:
```bash
cd apps/api
pnpm prisma migrate dev --name add_category_inheritance
pnpm prisma generate
```

---

## Phase 2: Backend Services

### 2.1 Category Service Updates

**File**: `apps/api/src/modules/category/category.service.ts`

```typescript
import { prisma } from '../db/client'
import { ConflictError, ValidationError } from '../lib/errors'

export class CategoryService {
  // FETCH categories for a specific site (includes global)
  async getSiteCategories(siteId: string) {
    return await prisma.category.findMany({
      where: {
        OR: [
          { siteId },           // Site-specific categories
          { isGlobal: true }    // Global categories from pusat
        ]
      },
      include: {
        site: true  // Include site info (null for global)
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  }

  // FETCH ALL categories (superadmin only)
  async getAllCategories() {
    return await prisma.category.findMany({
      include: {
        site: true
      },
      orderBy: [
        { siteId: 'asc' },    // Group by site (null first = global)
        { createdAt: 'asc' }
      ]
    })
  }

  // FETCH global categories only (superadmin only)
  async getGlobalCategories() {
    return await prisma.category.findMany({
      where: { isGlobal: true },
      include: { site: true }
    })
  }

  // CREATE category
  async createCategory(data: {
    name: string
    slug: string
    siteId?: string | null  // null = global
    description?: string
  }, actorUserId: string) {
    // Determine if global or site-specific
    const isGlobal = data.siteId === null
    
    // Validation: if siteId provided but empty string, treat as global
    const effectiveSiteId = data.siteId === '' ? null : data.siteId

    // Check slug uniqueness within scope
    const where = effectiveSiteId
      ? { slug: data.slug, siteId: effectiveSiteId }
      : { slug: data.slug, isGlobal: true }

    const existing = await prisma.category.findFirst({ where })
    if (existing) {
      throw new ConflictError(
        `Category with slug "${data.slug}" already exists in this scope`
      )
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        siteId: effectiveSiteId,
        isGlobal,
        description: data.description
      },
      include: { site: true }
    })

    // Audit log
    await this.logAudit(actorUserId, 'category.created', {
      categoryId: category.id,
      siteId: effectiveSiteId,
      isGlobal
    })

    return category
  }

  // UPDATE category
  async updateCategory(
    categoryId: string, 
    data: Partial<{ name: string; description: string }>,
    actorUserId: string
  ) {
    // Fetch existing first (to check if global)
    const existing = await prisma.category.findUnique({ 
      where: { id: categoryId } 
    })
    
    if (!existing) {
      throw new ValidationError('Category not found')
    }

    // Prevent modification of global categories (except name/description if allowed)
    // Policy: Global categories can be edited but NOT moved to site-specific
    if (existing.isGlobal && data.siteId !== undefined) {
      throw new ValidationError('Cannot change global category to site-specific')
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
      include: { site: true }
    })

    // Audit log
    await this.logAudit(actorUserId, 'category.updated', {
      categoryId,
      changes: data
    })

    return category
  }

  // DELETE category
  async deleteCategory(categoryId: string, actorUserId: string) {
    const existing = await prisma.category.findUnique({ 
      where: { id: categoryId } 
    })
    
    if (!existing) {
      throw new ValidationError('Category not found')
    }

    // Prevent deletion of global categories
    if (existing.isGlobal) {
      throw new ValidationError('Cannot delete global category')
    }

    await prisma.category.delete({
      where: { id: categoryId }
    })

    // Audit log
    await this.logAudit(actorUserId, 'category.deleted', {
      categoryId,
      siteId: existing.siteId
    })
  }

  // HELPER: Audit logging
  private async logAudit(
    userId: string, 
    action: string, 
    details: Record<string, any>
  ) {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        // siteId will be set by middleware
        details
      }
    })
  }
}
```

### 2.2 Site Controller (New Endpoints)

**File**: `apps/api/src/modules/site/site.controller.ts` (extend)

```typescript
import { Request, Response } from 'express'
import { prisma } from '../db/client'
import { requireSuperadmin } from '../middleware/auth.middleware'

export class SiteController {
  // GET /api/v1/sites?includeStats=true
  async getAllSites(req: Request, res: Response) {
    const { includeStats } = req.query
    const sites = await prisma.site.findMany({
      include: includeStats === 'true' ? {
        _count: {
          select: {
            users: { where: { role: { in: ['wapimred', 'journalist'] } } },
            articles: true,
            categories: true
          }
        }
      } : undefined,
      orderBy: { id: 'asc' }
    })

    res.json({
      success: true,
      data: sites.map(site => ({
        id: site.id,
        domain: site.domain,
        name: site.name,
        logoUrl: site.logoUrl,
        contactEmail: site.contactEmail,
        stats: includeStats === 'true' ? {
          users: site._count?.users || 0,
          articles: site._count?.articles || 0,
          categories: site._count?.categories || 0
        } : undefined
      }))
    })
  }

  // POST /api/v1/sites
  async createSite(req: Request, res: Response) {
    const { id, domain, name, wapimredId, logoUrl, contactEmail } = req.body

    // Validation
    if (!id || !domain) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Site ID and domain required' }
      })
    }

    // Check uniqueness
    const existing = await prisma.site.findFirst({ 
      where: { 
        OR: [{ id }, { domain }]
      } 
    })
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'SITE_EXISTS', 
          message: `Site with ID "${id}" or domain "${domain}" already exists` 
        }
      })
    }

    // Create site in transaction
    const site = await prisma.$transaction(async (tx) => {
      const newSite = await tx.site.create({
        data: {
          id,
          domain,
          name: name || id,
          logoUrl,
          contactEmail,
          trendingTopics: '[]'
        }
      })

      // Assign wapimred if provided
      if (wapimredId) {
        const user = await tx.user.findUnique({
          where: { id: wapimredId }
        })
        
        if (!user) {
          throw new Error(`User ${wapimredId} not found`)
        }
        
        if (user.role !== 'wapimred') {
          throw new Error(`User ${wapimredId} is not a wapimred`)
        }

        await tx.user.update({
          where: { id: wapimredId },
          data: { siteId: newSite.id }
        })

        // Audit log
        await tx.auditLog.create({
          data: {
            action: 'site.wapimred_assigned',
            userId: req.user!.id,
            siteId: newSite.id,
            details: { wapimredId }
          }
        })
      }

      return newSite
    })

    res.status(201).json({
      success: true,
      data: site
    })
  }

  // PUT /api/v1/sites/:id
  async updateSite(req: Request, res: Response) {
    const { id } = req.params
    const { domain, name, logoUrl, contactEmail, trendingTopics } = req.body

    const site = await prisma.site.update({
      where: { id },
      data: {
        domain,
        name,
        logoUrl,
        contactEmail,
        trendingTopics: trendingTopics ? JSON.stringify(trendingTopics) : undefined
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'site.updated',
        userId: req.user!.id,
        siteId: id,
        details: { updatedFields: Object.keys(req.body) }
      }
    })

    res.json({ success: true, data: site })
  }

  // DELETE /api/v1/sites/:id (soft delete by deactivating)
  async deleteSite(req: Request, res: Response) {
    const { id } = req.params
    
    // Check if site has active articles/users
    const stats = await prisma.site.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            articles: true,
            users: true
          }
        }
      }
    })

    if (stats?._count.articles > 0) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'SITE_HAS_DATA', 
          message: 'Cannot delete site with existing articles. Archive them first.' 
        }
      })
    }

    // Soft delete: just remove from cache, keep in DB for audit
    await prisma.site.delete({
      where: { id }
    })

    await prisma.auditLog.create({
      data: {
        action: 'site.deleted',
        userId: req.user!.id,
        siteId: id
      }
    })

    res.json({ success: true, message: 'Site deleted' })
  }
}
```

### 2.3 Category Controller Enhancement

**File**: `apps/api/src/modules/category/category.controller.ts`

```typescript
import { Request, Response } from 'express'
import { CategoryService } from './category.service'
import { requireSuperadmin } from '../middleware/auth.middleware'

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // GET /api/v1/categories
  async getCategories(req: Request, res: Response) {
    const { view } = req.query // 'global' | 'all' | default: site-specific

    // Superadmin-only routes
    if ((view === 'global' || view === 'all') && !requireSuperadmin(req, res)) {
      return
    }

    let categories
    if (view === 'global') {
      categories = await this.categoryService.getGlobalCategories()
    } else if (view === 'all') {
      categories = await this.categoryService.getAllCategories()
    } else {
      // Default: site-specific + global
      const siteId = req.site
      categories = await this.categoryService.getSiteCategories(siteId)
    }

    res.json({ success: true, data: categories })
  }

  // POST /api/v1/categories
  async createCategory(req: Request, res: Response) {
    const { name, slug, siteId, description } = req.body

    try {
      const category = await this.categoryService.createCategory(
        { name, slug, siteId, description },
        req.user!.id
      )
      res.status(201).json({ success: true, data: category })
    } catch (error) {
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_FAILED', message: error.message }
      })
    }
  }

  // PUT /api/v1/categories/:id
  async updateCategory(req: Request, res: Response) {
    const { id } = req.params
    const { name, description } = req.body

    try {
      const category = await this.categoryService.updateCategory(
        id,
        { name, description },
        req.user!.id
      )
      res.json({ success: true, data: category })
    } catch (error) {
      const status = error instanceof ValidationError ? 400 : 500
      res.status(status).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: error.message }
      })
    }
  }

  // DELETE /api/v1/categories/:id
  async deleteCategory(req: Request, res: Response) {
    const { id } = req.params

    try {
      await this.categoryService.deleteCategory(id, req.user!.id)
      res.json({ success: true, message: 'Category deleted' })
    } catch (error) {
      const status = error instanceof ValidationError ? 400 : 500
      res.status(status).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: error.message }
      })
    }
  }
}
```

### 2.4 Middleware Additions

**File**: `apps/api/src/middleware/auth.middleware.ts` (or create new)

```typescript
import { Request, Response, NextFunction } from 'express'

export function requireSuperadmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    })
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Superadmin access required' }
    })
  }

  next()
}
```

---

## Phase 3: Frontend Dashboard

### 3.1 Admin Dashboard Page

**New File**: `apps/web/app/[site]/dashboard/admin/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { SiteDialog } from './admin/site-dialog' // New component

interface Site {
  id: string
  domain: string
  name: string
  stats?: {
    users: number
    articles: number
    categories: number
  }
}

export default function AdminDashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)

  useEffect(() => {
    if (session?.user?.role !== 'superadmin') {
      router.push(`/${session?.user?.siteId || 'pusat'}/dashboard`)
      return
    }
    fetchSites()
  }, [session, router])

  const fetchSites = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/sites?includeStats=true')
      const data = await res.json()
      if (data.success) setSites(data.data)
    } catch (error) {
      console.error('Failed to fetch sites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSite = async (formData: any) => {
    const res = await fetch('/api/v1/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await res.json()
    if (data.success) {
      setDialogOpen(false)
      fetchSites()
    }
  }

  if (session?.user?.role !== 'superadmin') {
    return null // or loading spinner
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Site Management</h1>
        <div className="flex gap-2">
          {/* Site Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {selectedSiteId === 'all' ? 'All Sites' : selectedSiteId}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedSiteId('all')}>
                All Sites
              </DropdownMenuItem>
              {sites.map((site) => (
                <DropdownMenuItem 
                  key={site.id} 
                  onClick={() => setSelectedSiteId(site.id)}
                >
                  {site.name} ({site.id})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => { setEditingSite(null); setDialogOpen(true) }}>
            + Add Site
          </Button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site ID</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Wapimred</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell className="font-mono">{site.id}</TableCell>
                <TableCell>{site.domain}</TableCell>
                <TableCell>{site.name}</TableCell>
                <TableCell>
                  {/* Show wapimred name here */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {/* open assign dialog */}}
                  >
                    Assign →
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {site.stats && (
                      <>
                        <div>Journalists: {site.stats.users}</div>
                        <div>Articles: {site.stats.articles}</div>
                        <div>Categories: {site.stats.categories}</div>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditingSite(site); setDialogOpen(true) }}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Site Creation/Edit Dialog */}
      <SiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        site={editingSite}
        onSubmit={editingSite ? handleUpdateSite : handleCreateSite}
      />
    </div>
  )
}
```

### 3.2 Site Dialog Component

**New File**: `apps/web/app/[site]/dashboard/admin/site-dialog.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Site {
  id?: string
  domain?: string
  name?: string
  wapimredId?: string
}

interface SiteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  site: Site | null
  onSubmit: (data: any) => Promise<void>
}

export function SiteDialog({ open, onOpenChange, site, onSubmit }: SiteDialogProps) {
  const [formData, setFormData] = useState<Site>({})
  const [wapimreds, setWapimreds] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (site) {
      setFormData({
        id: site.id,
        domain: site.domain,
        name: site.name,
        wapimredId: site.wapimredId
      })
    } else {
      setFormData({})
    }
  }, [site])

  useEffect(() => {
    if (open) fetchWapimreds()
  }, [open])

  const fetchWapimreds = async () => {
    const res = await fetch('/api/v1/users?role=wapimred')
    const data = await res.json()
    if (data.success) setWapimreds(data.data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{site ? 'Edit Site' : 'Create New Site'}</DialogTitle>
          <DialogDescription>
            {site ? 'Update site configuration' : 'Add a new portal to the network'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siteId">Site ID *</Label>
              <Input
                id="siteId"
                value={formData.id || ''}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g., surabaya"
                required={!site}
                disabled={!!site} // Can't change ID after creation
              />
              <p className="text-xs text-gray-500">
                Unique slug, used in URLs: /[siteId]/
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain *</Label>
              <Input
                id="domain"
                value={formData.domain || ''}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="surabaya.beritakarya.co"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="BeritaKarya Surabaya"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wapimred">Assign Wapimred</Label>
              <Select 
                value={formData.wapimredId}
                onValueChange={(value) => setFormData({ ...formData, wapimredId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select wapimred" />
                </SelectTrigger>
                <SelectContent>
                  {wapimreds.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : site ? 'Update' : 'Create Site'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 3.3 Enhanced Categories Page

**File**: `apps/web/app/[site]/dashboard/categories/page.tsx` (modify)

**Changes to add**:

```tsx
// At the top of the component, add state:
const [isGlobalView, setIsGlobalView] = useState(false)
const [allCategories, setAllCategories] = useState<any[]>([])

// Add button (visible only to superadmin):
{session?.user?.role === 'superadmin' && (
  <div className="flex items-center space-x-2">
    <span className="text-sm">View Mode:</span>
    <Button
      variant={isGlobalView ? "default" : "outline"}
      size="sm"
      onClick={() => {
        setIsGlobalView(!isGlobalView)
        if (!isGlobalView) fetchAllCategories() // Fetch all when switching
      }}
    >
      {isGlobalView ? 'Site View' : 'Global View'}
    </Button>
  </div>
)}

// Modify fetch logic:
useEffect(() => {
  if (session?.user?.role === 'superadmin' && isGlobalView) {
    fetchAllCategories()
  } else {
    fetchCategories() // Existing: site-specific + global
  }
}, [session, isGlobalView])

// Fetch all categories (for superadmin global view):
const fetchAllCategories = async () => {
  const res = await fetch('/api/v1/categories?view=all')
  const data = await res.json()
  if (data.success) setAllCategories(data.data)
}

// Update table columns to show "Scope":
<TableCell>
  {category.siteId ? (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
      {category.siteId}
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
      GLOBAL
    </span>
  )}
</TableCell>

// Disable Delete button for global categories:
<Button
  variant="ghost"
  size="sm"
  disabled={category.isGlobal}
  onClick={() => handleDelete(category.id)}
>
  Delete
</Button>
{category.isGlobal && (
  <p className="text-xs text-gray-500 mt-1">Global categories cannot be deleted</p>
)}

// In Create Category dialog, add checkbox (superadmin only):
<FormField
  control={form.control}
  name="isGlobal"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel>Global Category</FormLabel>
        <FormDescription>
          Available to all sites automatically
        </FormDescription>
      </div>
      <FormControl>
        <Switch
          checked={field.value}
          onCheckedChange={field.onChange}
          disabled={session?.user?.role !== 'superadmin'}
        />
      </FormControl>
    </FormItem>
  )}
/>
```

### 3.4 Enhanced Users Page

**File**: `apps/web/app/[site]/dashboard/users/page.tsx` (modify)

**Additions**:

```tsx
// Add column to table:
<TableHead>Site</TableHead>

// In TableBody:
<TableCell>
  {user.siteId ? (
    <Badge variant="secondary">{user.siteId}</Badge>
  ) : (
    <span className="text-gray-500">-</span>
  )}
</TableCell>

// In Create User form, add site selection (if role is journalist/wapimred):
{((role === 'journalist' || role === 'wapimred') && (
  <FormField
    control={form.control}
    name="siteId"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Site Assignment *</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select site" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name} ({site.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
))}

// Validation: siteId required for journalist/wapimred
if ((role === 'journalist' || role === 'wapimred') && !siteId) {
  setError('siteId', { type: 'required', message: 'Site assignment is required' })
}
```

---

## Phase 4: API Endpoints

### 4.1 Routes Registration

**File**: `apps/api/src/routes/index.ts` (or wherever routes are registered)

```typescript
import { SiteController } from '../modules/site/site.controller'
import { CategoryController } from '../modules/category/category.controller'

export const router = Router()

// Sites API (superadmin only)
router.get('/sites', siteMiddleware, requireSuperadmin, new SiteController().getAllSites)
router.post('/sites', siteMiddleware, requireSuperadmin, new SiteController().createSite)
router.put('/sites/:id', siteMiddleware, requireSuperadmin, new SiteController().updateSite)
router.delete('/sites/:id', siteMiddleware, requireSuperadmin, new SiteController().deleteSite)

// Categories API (enhanced)
router.get('/categories', siteMiddleware, new CategoryController().getCategories)
router.post('/categories', siteMiddleware, requireAuth, requireSiteAccess, new CategoryController().createCategory)
router.put('/categories/:id', siteMiddleware, requireAuth, requireSiteAccess, new CategoryController().updateCategory)
router.delete('/categories/:id', siteMiddleware, requireAuth, requireSiteAccess, new CategoryController().deleteCategory)
```

---

## Deployment & Migration

### Pre-Deployment Checklist

- [ ] All code changes committed to feature branch
- [ ] Database migration SQL reviewed and tested locally
- [ ] Prisma schema updated and generated (`pnpm prisma generate`)
- [ ] Environment variables confirmed (DATABASE_URL)
- [ ] Backup current production database:

```bash
# VPS
docker exec beritakarya_db pg_dump -U beritakarya beritakarya > backup_$(date +%Y%m%d).sql
```

### Deployment Steps

**1. Deploy Backend API**:

```bash
# SSH into VPS
cd ~/beritakarya

# Pull latest code
git pull origin feature/multi-tenant-categories

# Run Prisma migration
docker exec -it beritakarya_api pnpm db:push
# OR if using migration files:
docker exec -it beritakarya_api pnpm prisma migrate deploy

# Rebuild and restart API container
docker compose -f infra/docker/docker-compose.backend.yml up -d --build api

# Wait for health check
sleep 10
curl https://api.beritakarya.co/health

# Check logs if needed
docker logs beritakarya_api --tail 50
```

**2. Deploy Frontend (Vercel)**:

- Push to GitHub
- Vercel auto-deploy will trigger
- Wait for deployment to complete

**3. Post-Deployment Verification**:

```bash
# Test category endpoints
curl -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  https://api.beritakarya.co/api/v1/categories

# Test site creation (as superadmin)
curl -X POST https://api.beritakarya.co/api/v1/sites \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":"test", "domain":"test.beritakarya.co", "name":"Test Site"}'

# Verify site-specific category fetch
curl "https://api.beritakarya.co/api/v1/categories?site=pusat"
```

### Migration Rollback

If migration fails:

```bash
# Rollback Prisma migration
docker exec -it beritakarya_api pnpm prisma migrate resolve --rolled-back "20250113_add_category_inheritance"

# Restore database backup
docker exec -i beritakarya_db psql -U beritakarya beritakarya < backup_20260113.sql

# Restart with previous code version
git checkout previous-commit
docker compose -f infra/docker/docker-compose.backend.yml up -d --build
```

---

## Testing Strategy

### Unit Tests

**Category Service Tests** (`apps/api/src/modules/category/category.service.spec.ts`):

```typescript
describe('CategoryService', () => {
  it('should fetch site categories including global', async () => {
    const categories = await service.getSiteCategories('surabaya')
    expect(categories).toHaveLength(6) // 2 local + 4 global
    expect(categories.every(c => c.siteId === 'surabaya' || c.isGlobal)).toBe(true)
  })

  it('should prevent deletion of global category', async () => {
    await expect(service.deleteCategory('global-cat-id', 'user1'))
      .rejects.toThrow('Cannot delete global category')
  })
})
```

### Integration Tests

**Multi-Tenant Data Isolation**:

```typescript
it('should isolate categories between sites', async () => {
  // User from surabaya should not see bandung-specific categories
  const surabayaCats = await fetchCategoriesAsUser('surabaya-user', 'surabaya')
  const hasBandungCategory = surabayaCats.some(c => c.siteId === 'bandung')
  expect(hasBandungCategory).toBe(false)
})
```

### Manual Testing Checklist

**Superadmin**:
- [ ] Can view all sites at `/[site]/dashboard/admin`
- [ ] Can create new site with wapimred assignment
- [ ] Can toggle global category view in `/[site]/dashboard/categories`
- [ ] Cannot delete global categories (button disabled)
- [ ] Can create global category (siteId = null)

**Wapimred**:
- [ ] Sees only own site in categories (no "All Sites" dropdown)
- [ ] Cannot create global category (checkbox hidden or disabled)
- [ ] User list shows all journalists in their site

**Journalist**:
- [ ] Sees global categories + own site categories
- [ ] Cannot access `/dashboard/admin` (404 or redirect)
- [ ] User management page shows site badge

---

## Rollback Plan

### Immediate Rollback (< 1 hour)

If critical bug discovered:

1. **API Rollback**:
```bash
cd ~/beritakarya
git revert <commit-hash>
docker compose -f infra/docker/docker-compose.backend.yml up -d --build
```

2. **Database Rollback**:
```bash
docker exec -it beritakarya_api pnpm prisma migrate resolve --rolled-back "20250113_add_category_inheritance"
```

3. **Frontend Rollback**:
```bash
# In Vercel dashboard, redeploy previous commit
```

### Data Recovery

If `siteId` or `isGlobal` columns cause issues:

```sql
-- Remove columns (if absolutely necessary)
ALTER TABLE "Category" DROP COLUMN "siteId";
ALTER TABLE "Category" DROP COLUMN "isGlobal";

-- Drop indexes
DROP INDEX "Category_siteId_idx";
DROP INDEX "Category_isGlobal_idx";
DROP INDEX "Category_slug_site_unique";
```

**Caution**: This will lose category inheritance. Only do if absolutely necessary.

---

## Success Metrics

After 1 week of production:

- [ ] Zero data leakage between sites (verify with audit logs)
- [ ] Superadmin can create/delete sites without issues
- [ ] Global categories appear on all site dashboards
- [ ] No performance regression (category queries < 100ms with proper indexing)
- [ ] All unit & integration tests passing

---

## Open Questions / Future Work

1. **Category Count Limit**: Should we enforce max 4 global + 3 local per site via UI?
2. **Default Category Assignment**: When creating new site, auto-assign which 4 global categories? (all global? configured?)
3. **Bulk Category Operations**: Superadmin ability to assign multiple global categories to multiple sites at once?
4. **Category Deletion Protection**: Should we allow soft-delete (archive) instead of hard delete?

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-13  
**Owner**: BeritaKarya Tech Team