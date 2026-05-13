import { Request, Response } from 'express'
import { siteService } from './site.service'

/**
 * Site Routes - Express Router
 * All routes are prefixed with /api/v1/sites
 * All endpoints require superadmin role
 */

/**
 * GET /api/v1/sites
 * Get all sites (superadmin only)
 * Query: ?includeStats=true to include user/article/category counts
 */
export async function getSites(req: Request, res: Response) {
  try {
    const { includeStats } = req.query
    const sites = await siteService.getAllSites(includeStats === 'true')
    res.json({ success: true, data: sites })
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      error: { code: 'SITES_FETCH_FAILED', message: error.message }
    })
  }
}

/**
 * GET /api/v1/sites/:id
 * Get single site by ID (superadmin only)
 */
export async function getSiteById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const site = await siteService.getSiteById(id)
    res.json({ success: true, data: site })
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      error: { code: 'SITE_FETCH_FAILED', message: error.message }
    })
  }
}

/**
 * POST /api/v1/sites
 * Create new site (superadmin only)
 * Optionally assign wapimred in the same request
 */
export async function createSite(req: Request, res: Response) {
  try {
    const { id, domain, name, wapimredId, logoUrl, contactEmail, phone, address, description } = req.body
    const actorUserId = (req as any).user?.userId

    const site = await siteService.createSite({
      id,
      domain,
      name,
      wapimredId,
      logoUrl,
      contactEmail,
      phone,
      address,
      description
    })

    res.status(201).json({ success: true, data: site })
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      error: { code: 'SITE_CREATE_FAILED', message: error.message }
    })
  }
}

/**
 * PUT /api/v1/sites/:id
 * Update site (superadmin only)
 */
export async function updateSite(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { domain, name, logoUrl, contactEmail, phone, address, description, trendingTopics } = req.body
    const actorUserId = (req as any).user?.userId

    const site = await siteService.updateSite(
      id,
      { domain, name, logoUrl, contactEmail, phone, address, description, trendingTopics },
      actorUserId
    )

    res.json({ success: true, data: site })
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      error: { code: 'SITE_UPDATE_FAILED', message: error.message }
    })
  }
}

/**
 * DELETE /api/v1/sites/:id
 * Delete site (superadmin only)
 * Prevents deletion if site has existing articles
 */
export async function deleteSite(req: Request, res: Response) {
  try {
    const { id } = req.params
    const actorUserId = (req as any).user?.userId

    await siteService.deleteSite(id, actorUserId)

    res.json({ success: true, message: 'Site deleted' })
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      error: { code: 'SITE_DELETE_FAILED', message: error.message }
    })
  }
}

/**
 * POST /api/v1/sites/:id/wapimred
 * Assign wapimred to a site (superadmin only)
 */
export async function assignWapimred(req: Request, res: Response) {
  try {
    const { id } = req.params  // siteId
    const { wapimredId } = req.body
    const actorUserId = (req as any).user?.userId

    const user = await siteService.assignWapimred(id, wapimredId, actorUserId)

    res.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        siteId: user.siteId
      }
    })
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      error: { code: 'WAPIMRED_ASSIGN_FAILED', message: error.message }
    })
  }
}