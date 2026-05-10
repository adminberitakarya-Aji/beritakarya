import { prisma } from '../../db/client'

export async function getSiteSettings(siteId: string) {
  try {
    let site = await prisma.site.findUnique({
      where: { id: siteId }
    })

    // Jika belum ada di DB (misal baru di config), buat record default
    if (!site) {
      console.log(`[SiteService] Creating default record for site: ${siteId}`)
      site = await prisma.site.create({
        data: {
          id: siteId,
          name: siteId.charAt(0).toUpperCase() + siteId.slice(1),
          domain: `${siteId}.beritakarya.co`,
          trendingTopics: []
        }
      })
    }

    return site
  } catch (error) {
    console.error(`[SiteService] Error in getSiteSettings for ${siteId}:`, error)
    throw error
  }
}

export async function updateSiteSettings(siteId: string, data: any) {
  try {
    return await prisma.site.update({
      where: { id: siteId },
      data: {
        name: data.name || undefined,
        domain: data.domain || undefined,
        description: data.description,
        logoUrl: data.logoUrl,
        footerText: data.footerText,
        address: data.address,
        contactEmail: data.contactEmail,
        phone: data.phone,
        aboutUs: data.aboutUs,
        codeOfEthics: data.codeOfEthics,
        editorial: data.editorial,
        advertising: data.advertising,
        socialLinks: data.socialLinks || {},
        appearance: data.appearance || { primaryColor: '#e11d48' },
        trendingTopics: data.trendingTopics || []
      }
    })
  } catch (error) {
    console.error(`[SiteService] Error in updateSiteSettings for ${siteId}:`, error)
    throw error
  }
}
