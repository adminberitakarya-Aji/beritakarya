import { prisma } from '../../db/client'
import type { Prisma } from '@prisma/client'

export async function findArticlesBySite(
  siteId: string,
  opts: { status?: string; search?: string; category?: string; page?: number; limit?: number } = {}
) {
  const { status, search, category, page = 1, limit = 20 } = opts
  const where: Prisma.ArticleWhereInput = {
    siteId,
    ...(status && { status }),
    ...(category && { category: { name: { equals: category, mode: 'insensitive' } } }),
    ...(search && { 
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { blocks: { path: ['$'], string_contains: search } } // Search in content blocks
      ]
    })
  }
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: {
        id: true, title: true, slug: true, status: true,
        siteId: true, authorId: true, publishedAt: true, createdAt: true,
        author: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.article.count({ where })
  ])
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function findArticleById(id: string, siteId: string) {
  return prisma.article.findFirst({
    where: { id, siteId },
    include: { author: { select: { id: true, name: true, email: true } } }
  })
}

export async function findArticleBySlug(slug: string, siteId: string) {
  return prisma.article.findUnique({
    where: { siteId_slug: { siteId, slug } },
    include: { author: { select: { id: true, name: true } } }
  })
}

export async function findPublishedArticleBySlug(slug: string, siteId: string) {
  return prisma.article.findFirst({
    where: { siteId, slug, status: 'published' },
    include: { author: { select: { id: true, name: true } } }
  })
}

export async function createArticle(data: {
  title: string; slug: string; siteId: string
  authorId: string; categoryId?: string | null; tags?: any; blocks?: any[]
}) {
  return prisma.article.create({ data: { ...data, blocks: data.blocks ?? [] } })
}

export async function updateArticle(
  id: string, siteId: string,
  data: Partial<{ title: string; blocks: any[]; metaTitle: string; metaDescription: string; status: string; categoryId: string | null; tags: any }>
) {
  return prisma.article.update({ where: { id }, data })
}

export async function deleteArticle(id: string) {
  return prisma.article.delete({ where: { id } })
}

export async function slugExists(slug: string, siteId: string, excludeId?: string) {
  const article = await prisma.article.findFirst({
    where: { slug, siteId, ...(excludeId && { id: { not: excludeId } }) }
  })
  return !!article
}