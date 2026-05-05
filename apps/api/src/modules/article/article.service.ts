import * as repo from './article.repository'
import { generateSlug } from '@beritakarya/utils'
import type { JWTPayload } from '@beritakarya/types'

export async function getArticles(
  siteId: string,
  query: { status?: string; search?: string; category?: string; page?: number; limit?: number }
) {
  return repo.findArticlesBySite(siteId, query)
}

export async function getArticleById(id: string, siteId: string) {
  const article = await repo.findArticleById(id, siteId)
  if (!article) throw Object.assign(new Error('Artikel tidak ditemukan'), { statusCode: 404 })
  return article
}

export async function getArticleBySlug(slug: string, siteId: string) {
  const article = await repo.findArticleBySlug(slug, siteId)
  if (!article) throw Object.assign(new Error('Artikel tidak ditemukan'), { statusCode: 404 })
  return article
}

export async function getPublishedArticleBySlug(slug: string, siteId: string) {
  const article = await repo.findPublishedArticleBySlug(slug, siteId)
  if (!article) throw Object.assign(new Error('Artikel tidak ditemukan'), { statusCode: 404 })
  return article
}

export async function createArticle(
  input: { title: string; blocks?: any[]; categoryId?: string | null; tags?: string[] },
  user: JWTPayload, siteId: string
) {
  let slug = generateSlug(input.title)
  let counter = 2
  while (await repo.slugExists(slug, siteId)) {
    slug = `${generateSlug(input.title)}-${counter++}`
  }
  return repo.createArticle({
    title: input.title,
    slug,
    siteId,
    authorId: user.userId,
    categoryId: input.categoryId,
    tags: input.tags ?? [],
    blocks: input.blocks ?? []
  })
}

export async function updateArticle(
  id: string, siteId: string,
  input: Partial<{ title: string; blocks: any[]; metaTitle: string; metaDescription: string; categoryId: string | null; tags: string[] }>,
  user: JWTPayload
) {
  const article = await repo.findArticleById(id, siteId)
  if (!article) throw Object.assign(new Error('Artikel tidak ditemukan'), { statusCode: 404 })
  if (!['superadmin', 'pimred'].includes(user.role) && article.authorId !== user.userId) {
    throw Object.assign(new Error('Anda tidak punya akses ke artikel ini'), { statusCode: 403 })
  }
  let data: any = { ...input }
  if (input.title && input.title !== article.title) {
    let slug = generateSlug(input.title)
    let counter = 2
    while (await repo.slugExists(slug, siteId, id)) {
      slug = `${generateSlug(input.title)}-${counter++}`
    }
    data.slug = slug
  }
  return repo.updateArticle(id, siteId, data)
}

export async function publishArticle(id: string, siteId: string, user: JWTPayload) {
  const article = await repo.findArticleById(id, siteId)
  if (!article) throw Object.assign(new Error('Artikel tidak ditemukan'), { statusCode: 404 })
  if (!['superadmin', 'pimred'].includes(user.role)) {
    throw Object.assign(new Error('Akses ditolak: Hanya Pimred dan Superadmin yang dapat mem-publish artikel'), { statusCode: 403 })
  }
  return repo.updateArticle(id, siteId, {
    status: 'published',
    publishedAt: new Date()
  } as any)
}

export async function deleteArticle(id: string, siteId: string, user: JWTPayload) {
  const article = await repo.findArticleById(id, siteId)
  if (!article) throw Object.assign(new Error('Artikel tidak ditemukan'), { statusCode: 404 })
  if (!['superadmin', 'pimred'].includes(user.role) && article.authorId !== user.userId) {
    throw Object.assign(new Error('Akses ditolak'), { statusCode: 403 })
  }
  return repo.deleteArticle(id)
}