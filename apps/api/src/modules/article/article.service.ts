import * as repo from './article.repository'
import { generateSlug } from '@beritakarya/utils'
import type { JWTPayload } from '@beritakarya/types'
import { sendNotification } from '../notification/notification.controller'
import { prisma } from '../../db/client'
import { recordView } from '../analytics/analytics.service'
import * as searchService from './search.service'
import { getCache, setCache, deleteCache } from '../../lib/redis'

export async function getArticles(
  siteId: string,
  query: { status?: string; search?: string; category?: string; page?: number; limit?: number },
  user?: JWTPayload
) {
  // If search is provided, use Meilisearch
  if (query.search) {
    const searchResult = await searchService.searchArticles(query.search, {
      siteId,
      status: query.status
    })
    
    if (searchResult) {
      // In a real app, we'd fetch full objects from DB using IDs from search results
      // or ensure Meilisearch has all needed fields. 
      // For now, we'll return the search hits directly as articles.
      return {
        items: searchResult.hits,
        total: searchResult.estimatedTotalHits,
        page: 1,
        limit: query.limit || 20
      }
    }
  }

  const opts: any = { ...query }
  
  // If user is a journalist, they can only see their own articles
  if (user?.role === 'journalist') {
    opts.authorId = user.userId
  }

  return repo.findArticlesBySite(siteId, opts)
}

export async function getArticleById(id: string, siteId: string, user?: JWTPayload) {
  const article = await repo.findArticleById(id, siteId)
  if (!article) throw Object.assign(new Error('Post tidak ditemukan'), { statusCode: 404 })
  
  // Authorization: Journalists can only view their own articles (unless published, but dashboard usually shows drafts)
  if (user && !['superadmin', 'wapimred'].includes(user.role) && article.authorId !== user.userId) {
    throw Object.assign(new Error('Anda tidak punya akses ke post ini'), { statusCode: 403 })
  }

  return article
}

export async function getArticleBySlug(slug: string, siteId: string) {
  const article = await repo.findArticleBySlug(slug, siteId)
  if (!article) throw Object.assign(new Error('Post tidak ditemukan'), { statusCode: 404 })
  return article
}

export async function getPublishedArticleBySlug(
  slug: string, 
  siteId: string, 
  meta?: { ipAddress?: string; userAgent?: string; referrer?: string }
) {
  const cacheKey = `article:${siteId}:${slug}`
  const cached = await getCache<any>(cacheKey)
  
  let article = cached
  if (!article) {
    article = await repo.findPublishedArticleBySlug(slug, siteId)
    if (!article) throw Object.assign(new Error('Post tidak ditemukan'), { statusCode: 404 })
    await setCache(cacheKey, article, 3600) // Cache for 1 hour
  }
  
  // Async recording (don't block the response)
  recordView({
    siteId,
    articleId: article.id,
    path: `/post/${slug}`,
    ...meta
  }).catch(err => console.error('Failed to record view:', err))
  
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
  const article = await repo.createArticle({
    title: input.title,
    slug,
    siteId,
    authorId: user.userId,
    categoryId: input.categoryId,
    tags: input.tags ?? [],
    blocks: input.blocks ?? []
  })

  await repo.createAuditLog({
    userId: user.userId,
    siteId,
    action: 'post.create',
    entityType: 'post',
    entityId: article.id,
    newValue: article
  })

  // Indexing
  searchService.indexArticle(article).catch(err => console.error('Failed to index article:', err))

  return article
}

export async function updateArticle(
  id: string, siteId: string,
  input: Partial<{ 
    title: string; blocks: any[]; metaTitle: string; metaDescription: string; 
    categoryId: string | null; tags: string[]; status: string;
    isBreaking: boolean; isExclusive: boolean; isFeatured: boolean;
    featuredImage: string; reviewNotes: string;
  }>,
  user: JWTPayload
) {
  const article = await repo.findArticleById(id, siteId)
  if (!article) throw Object.assign(new Error('Post tidak ditemukan'), { statusCode: 404 })
  
  // Authorization
  if (!['superadmin', 'wapimred'].includes(user.role) && article.authorId !== user.userId) {
    throw Object.assign(new Error('Anda tidak punya akses ke post ini'), { statusCode: 403 })
  }

  // Prevent journalists from setting certain statuses directly
  if (user.role === 'journalist' && input.status && !['draft', 'submitted'].includes(input.status)) {
     if (article.status !== 'revision' && input.status !== 'submitted') {
        throw Object.assign(new Error('Hanya Wapimred yang dapat mengubah status ke ' + input.status), { statusCode: 403 })
     }
  }

  let data: any = { ...input }
  
  // Handle Slug Change
  if (input.title && input.title !== article.title) {
    let slug = generateSlug(input.title)
    let counter = 2
    while (await repo.slugExists(slug, siteId, id)) {
      slug = `${generateSlug(input.title)}-${counter++}`
    }
    data.slug = slug
  }

  // Auto-calculate word count and reading time if blocks changed
  if (input.blocks) {
    const textContent = input.blocks
      .filter((b: any) => b.type === 'paragraph' || b.type === 'heading')
      .map((b: any) => b.content)
      .join(' ')
    const words = textContent.trim().split(/\s+/).length
    data.wordCount = words
    data.readingTimeMin = Math.max(1, Math.ceil(words / 200))
  }

  const updated = await repo.updateArticle(id, siteId, data)

  // Auto-save version on submission
  if (input.status === 'submitted') {
     await saveArticleVersion(id, user.userId, siteId)
  }

  // Notifications
  if (input.status === 'submitted') {
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true }
    })
    const userName = userData?.name || 'User'

    const editors = await prisma.user.findMany({
      where: { siteId, role: { in: ['superadmin', 'wapimred'] } },
      select: { id: true }
    })
    for (const editor of editors) {
      await sendNotification({
        userId: editor.id,
        siteId,
        type: 'post_submitted',
        title: 'Post Baru Masuk Antrian',
        message: `${userName} baru saja mengirim post "${updated.title}" untuk di-review.`,
        link: `/${siteId}/dashboard/review`
      })
    }
  } else if (input.status === 'revision') {
    await sendNotification({
      userId: updated.authorId,
      siteId,
      type: 'post_reviewed',
      title: 'Revisi Diperlukan',
      message: `Editor meminta revisi untuk post "${updated.title}". Catatan: ${input.reviewNotes || 'Cek dashboard.'}`,
      link: `/${siteId}/dashboard/articles/${id}`
    })
  }

  await repo.createAuditLog({
    userId: user.userId,
    siteId,
    action: 'post.update',
    entityType: 'post',
    entityId: id,
    oldValue: article,
    newValue: updated
  })

  // Re-indexing
  searchService.indexArticle(updated).catch(err => console.error('Failed to index article:', err))

  // Invalidate cache
  deleteCache(`article:${siteId}:${updated.slug}`).catch(() => {})

  return updated
}

export async function publishArticle(id: string, siteId: string, user: JWTPayload) {
  const article = await repo.findArticleById(id, siteId)
  if (!article) throw Object.assign(new Error('Post tidak ditemukan'), { statusCode: 404 })
  
  if (!['superadmin', 'wapimred'].includes(user.role)) {
    throw Object.assign(new Error('Akses ditolak: Hanya Wapimred dan Superadmin yang dapat mem-publish post'), { statusCode: 403 })
  }

  const updated = await repo.updateArticle(id, siteId, {
    status: 'published',
    publishedAt: new Date()
  } as any)

  // Auto-save version on publish
  await saveArticleVersion(id, user.userId, siteId)

  // Notify author
  await sendNotification({
    userId: updated.authorId,
    siteId,
    type: 'post_reviewed',
    title: 'Post Berhasil Terbit!',
    message: `Selamat! Post "${updated.title}" Anda telah disetujui dan terbit sekarang.`,
    link: `/${siteId}/post/${updated.slug}`
  })

  await repo.createAuditLog({
    userId: user.userId,
    siteId,
    action: 'post.publish',
    entityType: 'post',
    entityId: id,
    oldValue: article,
    newValue: updated
  })

  return updated
}

export async function deleteArticle(id: string, siteId: string, user: JWTPayload) {
  const article = await repo.findArticleById(id, siteId)
  if (!article) throw Object.assign(new Error('Post tidak ditemukan'), { statusCode: 404 })
  
  if (!['superadmin', 'wapimred'].includes(user.role) && article.authorId !== user.userId) {
    throw Object.assign(new Error('Akses ditolak'), { statusCode: 403 })
  }

  await repo.createAuditLog({
    userId: user.userId,
    siteId,
    action: 'post.delete',
    entityType: 'post',
    entityId: id,
    oldValue: article
  })

  // Remove from index
  searchService.deleteIndexedArticle(id).catch(err => console.error('Failed to delete indexed article:', err))

  return repo.deleteArticle(id)
}

export async function getArticleVersions(articleId: string) {
  return repo.findVersions(articleId)
}

export async function saveArticleVersion(articleId: string, authorId: string, siteId: string) {
  const article = await repo.findArticleById(articleId, siteId)
  if (!article) throw new Error('Post tidak ditemukan')

  const versionNumber = await repo.getNextVersionNumber(articleId)
  return repo.createVersion({
    articleId,
    title: article.title,
    blocks: article.blocks as any[],
    version: versionNumber,
    authorId
  })
}

export async function restoreArticleVersion(versionId: string, siteId: string, user: JWTPayload) {
  const version = await repo.findVersionById(versionId)
  if (!version) throw new Error('Versi tidak ditemukan')

  const article = await repo.findArticleById(version.articleId, siteId)
  if (!article) throw new Error('Post tidak ditemukan')

  // Authorization check
  if (!['superadmin', 'wapimred'].includes(user.role) && article.authorId !== user.userId) {
    throw new Error('Akses ditolak')
  }

  const updated = await repo.updateArticle(article.id, siteId, {
    title: version.title,
    blocks: version.blocks as any[]
  })

  await repo.createAuditLog({
    userId: user.userId,
    siteId,
    action: 'post.restore_version',
    entityType: 'post',
    entityId: article.id,
    oldValue: article,
    newValue: updated
  })

  return updated
}