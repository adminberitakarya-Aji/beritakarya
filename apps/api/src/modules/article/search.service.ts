import { MeiliSearch } from 'meilisearch'
import { env } from '../../lib/env'

const client = new MeiliSearch({
  host: env.MEILISEARCH_HOST,
  apiKey: env.MEILISEARCH_KEY,
})

const index = client.index('articles')

export async function indexArticle(article: any) {
  try {
    await index.addDocuments([{
      id: article.id,
      title: article.title,
      slug: article.slug,
      siteId: article.siteId,
      categoryId: article.categoryId,
      authorId: article.authorId,
      status: article.status,
      blocks: article.blocks, // You might want to strip HTML or keep text only
      tags: article.tags,
      featuredImage: article.featuredImage,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt
    }])
  } catch (error) {
    console.error('Meilisearch indexing failed:', error)
  }
}

export async function deleteIndexedArticle(id: string) {
  try {
    await index.deleteDocument(id)
  } catch (error) {
    console.error('Meilisearch deletion failed:', error)
  }
}

export async function searchArticles(query: string, filters: { siteId: string; status?: string }) {
  try {
    let filter = `siteId = "${filters.siteId}"`
    if (filters.status) {
      filter += ` AND status = "${filters.status}"`
    }

    const result = await index.search(query, {
      filter,
      sort: ['publishedAt:desc'],
      limit: 20
    })
    return result
  } catch (error) {
    console.error('Meilisearch search failed:', error)
    return null
  }
}
