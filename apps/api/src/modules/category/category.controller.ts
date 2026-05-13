import { Request, Response } from 'express'
import { categoryService } from './category.service'

/**
 * Category Routes - Express Router
 * All routes are prefixed with /api/v1/categories
 */

/**
 * GET /api/v1/categories
 * Fetches categories based on user role and query parameter:
 * - Regular users/wapimred: site-specific + global categories
 * - Superadmin with ?view=all: all categories across sites
 * - Superadmin with ?view=global: only global categories
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const { view } = req.query
    const user = (req as any).user
    const siteId = (req as any).site

    // Superadmin-only routes
    if (view === 'global' || view === 'all') {
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Superadmin access required' }
        })
      }
    }

    let categories

    if (view === 'global') {
      // Superadmin: get only global categories
      categories = await categoryService.getGlobalCategories()
    } else if (view === 'all') {
      // Superadmin: get all categories (site-specific + global)
      categories = await categoryService.getAllCategories()
    } else {
      // Regular: site-specific + global (for the current site)
      if (!siteId) {
        return res.status(400).json({
          success: false,
          error: { code: 'SITE_REQUIRED', message: 'Site parameter required' }
        })
      }
      categories = await categoryService.getSiteCategories(siteId)
    }

    res.json({ success: true, data: categories })
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      error: { code: 'CATEGORY_FETCH_FAILED', message: error.message }
    })
  }
}

/**
 * POST /api/v1/categories
 * Create a new category (site-specific or global)
 * Only superadmin can create global categories (siteId=null)
 */
export async function createCategory(req: Request, res: Response) {
  try {
    const { name, slug, siteId, description } = req.body
    const user = (req as any).user
    const actorUserId = user?.userId

    // Validation: non-superadmin cannot create global categories
    if (siteId === null || siteId === undefined) {
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only superadmin can create global categories' }
        })
      }
    }

    // Non-superadmin must have siteId (cannot create global)
    if (siteId === undefined && user?.role !== 'superadmin') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Site ID required for non-superadmin' }
      })
    }

    const category = await categoryService.createCategory(
      { name, slug, siteId, description },
      actorUserId
    )

    res.status(201).json({ success: true, data: category })
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      error: { code: 'CATEGORY_CREATE_FAILED', message: error.message }
    })
  }
}

/**
 * PUT /api/v1/categories/:id
 * Update category (name, description, siteId)
 * Note: Global categories cannot be changed to site-specific
 */
export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, description, siteId } = req.body
    const actorUserId = (req as any).user?.userId

    const category = await categoryService.updateCategory(
      id,
      { name, description, siteId },
      actorUserId
    )

    res.json({ success: true, data: category })
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      error: { code: 'CATEGORY_UPDATE_FAILED', message: error.message }
    })
  }
}

/**
 * DELETE /api/v1/categories/:id
 * Delete a category (global categories cannot be deleted)
 */
export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params
    const actorUserId = (req as any).user?.userId

    await categoryService.deleteCategory(id, actorUserId)

    res.json({ success: true, message: 'Category deleted' })
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      error: { code: 'CATEGORY_DELETE_FAILED', message: error.message }
    })
  }
}