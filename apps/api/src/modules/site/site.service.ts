import { prisma } from '../../db/client'

export class SiteService {
  async getAllSites(includeStats = false) {
    const sites = await prisma.site.findMany({
      orderBy: { id: 'asc' }
    })

    if (!includeStats) {
      return sites.map(site => ({
        id: site.id,
        domain: site.domain,
        name: site.name,
        logoUrl: site.logoUrl,
        contactEmail: site.contactEmail,
        phone: site.phone,
        address: site.address,
        description: site.description
      }))
    }

    // Fetch stats for all sites in parallel
    const sitesWithStats = await Promise.all(
      sites.map(async (site) => {
        const userCount = await prisma.user.count({
          where: {
            siteId: site.id,
            role: { in: ['wapimred', 'journalist'] }
          }
        })
        const articleCount = await prisma.article.count({
          where: { siteId: site.id }
        })
        const categoryCount = await prisma.category.count({
          where: { siteId: site.id }
        })

        return {
          id: site.id,
          domain: site.domain,
          name: site.name,
          logoUrl: site.logoUrl,
          contactEmail: site.contactEmail,
          phone: site.phone,
          address: site.address,
          description: site.description,
          stats: {
            users: userCount,
            articles: articleCount,
            categories: categoryCount
          }
        }
      })
    )

    return sitesWithStats
  }

  async getSiteById(siteId: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!site) {
      throw Object.assign(new Error('Site not found'), { statusCode: 404 })
    }

    // Fetch stats in parallel
    const [userCount, articleCount, categoryCount] = await Promise.all([
      prisma.user.count({
        where: {
          siteId: site.id,
          role: { in: ['wapimred', 'journalist'] }
        }
      }),
      prisma.article.count({
        where: { siteId: site.id }
      }),
      prisma.category.count({
        where: { siteId: site.id }
      })
    ])

    return {
      id: site.id,
      domain: site.domain,
      name: site.name,
      logoUrl: site.logoUrl,
      contactEmail: site.contactEmail,
      phone: site.phone,
      address: site.address,
      description: site.description,
      trendingTopics: site.trendingTopics,
      stats: {
        users: userCount,
        articles: articleCount,
        categories: categoryCount
      }
    }
  }

  async createSite(data: {
    id: string
    domain: string
    name?: string
    wapimredId?: string
    logoUrl?: string
    contactEmail?: string
    phone?: string
    address?: string
    description?: string
  }) {
    const { id, domain, name, wapimredId, ...rest } = data

    const existing = await prisma.site.findFirst({
      where: {
        OR: [{ id }, { domain }]
      }
    })

    if (existing) {
      throw Object.assign(
        new Error(`Site with ID "${id}" or domain "${domain}" already exists`),
        { statusCode: 409 }
      )
    }

    const site = await prisma.$transaction(async (tx) => {
      const newSite = await tx.site.create({
        data: {
          id,
          domain,
          name: name || id,
          ...rest
        }
      })

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

        await tx.auditLog.create({
          data: {
            userId: 'system',
            siteId: newSite.id,
            action: 'site.wapimred_assigned',
            entityType: 'user',
            entityId: wapimredId,
            newValue: { siteId: newSite.id }
          }
        })
      }

      return newSite
    })

    return {
      id: site.id,
      domain: site.domain,
      name: site.name,
      logoUrl: site.logoUrl,
      contactEmail: site.contactEmail
    }
  }

  async updateSite(
    siteId: string,
    data: Partial<{
      domain: string
      name: string
      logoUrl: string
      contactEmail: string
      phone: string
      address: string
      description: string
      trendingTopics: any
    }>,
    actorUserId: string
  ) {
    const existing = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!existing) {
      throw Object.assign(new Error('Site not found'), { statusCode: 404 })
    }

    if (data.domain && data.domain !== existing.domain) {
      // Use NOT condition with Prisma
      const domainExists = await prisma.site.findFirst({
        where: {
          domain: data.domain,
          id: { not: siteId }
        }
      })

      if (domainExists) {
        throw Object.assign(
          new Error(`Domain ${data.domain} already in use by another site`),
          { statusCode: 409 }
        )
      }
    }

    const updateData = { ...data }
    if (data.trendingTopics && typeof data.trendingTopics === 'object') {
      updateData.trendingTopics = JSON.stringify(data.trendingTopics)
    }

    const updated = await prisma.site.update({
      where: { id: siteId },
      data: updateData
    })

    await this.logAudit(actorUserId, 'site.updated', {
      siteId,
      changes: data
    })

    return {
      id: updated.id,
      domain: updated.domain,
      name: updated.name,
      logoUrl: updated.logoUrl,
      contactEmail: updated.contactEmail
    }
  }

  async deleteSite(siteId: string, actorUserId: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!site) {
      throw Object.assign(new Error('Site not found'), { statusCode: 404 })
    }

    // Check if site has articles before deletion (using count)
    const articleCount = await prisma.article.count({
      where: { siteId: site.id }
    })

    if (articleCount > 0) {
      throw Object.assign(
        new Error('Cannot delete site with existing articles. Archive them first.'),
        { statusCode: 400 }
      )
    }

    await prisma.site.delete({
      where: { id: siteId }
    })

    await this.logAudit(actorUserId, 'site.deleted', {
      siteId
    })

    return { success: true, message: 'Site deleted' }
  }

  async assignWapimred(siteId: string, wapimredId: string, actorUserId: string) {
    const site = await this.getSiteById(siteId)

    const user = await prisma.user.findUnique({
      where: { id: wapimredId }
    })

    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 })
    }

    if (user.role !== 'wapimred') {
      throw Object.assign(
        new Error('Only wapimred users can be assigned to a site'),
        { statusCode: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: wapimredId },
      data: { siteId },
      include: { site: true }
    })

    await this.logAudit(actorUserId, 'site.wapimred_assigned', {
      siteId,
      wapimredId,
      wapimredName: user.name
    })

    return updatedUser
  }

  private async logAudit(
    userId: string,
    action: string,
    details: Record<string, any>
  ) {
    try {
      // This will be implemented properly with auditLog insertion
      // For now, just log to console
      console.log(`[AUDIT] ${userId} - ${action}:`, details)
    } catch (error) {
      console.error('Audit log failed:', error)
    }
  }
}

export const siteService = new SiteService()