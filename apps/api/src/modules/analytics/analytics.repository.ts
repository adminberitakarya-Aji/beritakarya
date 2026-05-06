import { prisma } from '../../db/client'

export async function getTrafficStats(siteId: string, days: number = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // In a real app, we'd query a 'Views' table. 
  // Here we simulate daily traffic based on article views and publish dates 
  // to provide a realistic-looking chart without complex tracking logic yet.
  
  const articles = await prisma.article.findMany({
    where: {
      siteId,
      status: 'published',
      publishedAt: { gte: startDate }
    },
    select: {
      publishedAt: true,
      viewCount: true
    }
  })

  // Group by day
  const dailyData: Record<string, number> = {}
  
  // Initialize last X days
  for (let i = 0; i <= days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dailyData[key] = 0
  }

  articles.forEach((art: any) => {
    if (art.publishedAt) {
      const key = art.publishedAt.toISOString().split('T')[0]
      if (dailyData[key] !== undefined) {
        dailyData[key] += art.viewCount
      }
    }
  })

  // Convert to array for Recharts
  return Object.entries(dailyData)
    .map(([date, views]) => ({
      date,
      views: views
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getTopContent(siteId: string, limit: number = 5) {
  return prisma.article.findMany({
    where: { siteId, status: 'published' },
    orderBy: { viewCount: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      category: { select: { name: true } }
    }
  })
}
