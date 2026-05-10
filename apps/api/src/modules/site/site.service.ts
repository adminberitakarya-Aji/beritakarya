import { prisma } from '../../db/client'

export async function getSiteSettings(siteId: string) {
  let site = await prisma.site.findUnique({
    where: { id: siteId }
  })

  // Jika belum ada di DB (misal baru di config), buat record default
  if (!site) {
    try {
      site = await prisma.site.create({
        data: {
          id: siteId,
          name: siteId.charAt(0).toUpperCase() + siteId.slice(1),
          domain: `${siteId}.beritakarya.co`,
          trendingTopics: []
        }
      })
    } catch (e) {
      // Handle race condition if multiple requests create at the same time
      site = await prisma.site.findUnique({ where: { id: siteId } })
    }
  }

  return site
}

export async function updateSiteSettings(siteId: string, data: any) {
  return prisma.site.update({
    where: { id: siteId },
    data: {
      name: data.name,
      domain: data.domain,
      description: data.description,
      logoUrl: data.logoUrl,
      footerText: data.footerText,
      socialLinks: data.socialLinks,
      appearance: data.appearance,
      trendingTopics: data.trendingTopics
    }
  })
}
