import { prisma } from '../../db/client'

export async function recordView(data: {
  siteId: string
  articleId?: string
  path: string
  referrer?: string
  ipAddress?: string
  userAgent?: string
}) {
  try {
    // Record the page view
    await prisma.pageView.create({
      data: {
        siteId: data.siteId,
        articleId: data.articleId,
        path: data.path,
        referrer: data.referrer,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    })

    // Increment article view count if articleId is provided
    if (data.articleId) {
      await prisma.article.update({
        where: { id: data.articleId },
        data: { viewCount: { increment: 1 } }
      })
    }
  } catch (error) {
    console.error('Failed to record view:', error)
  }
}
