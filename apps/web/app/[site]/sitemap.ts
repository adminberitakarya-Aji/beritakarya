import { MetadataRoute } from 'next'

async function getArticles(site: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const res = await fetch(`${apiUrl}/api/v1/articles/public?site=${site}&limit=100`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return json.data?.articles || json.data?.items || []
  } catch (e) {
    return []
  }
}

async function getCategories(site: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const res = await fetch(`${apiUrl}/api/v1/categories?site=${site}`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch (e) {
    return []
  }
}

export default async function sitemap({ params }: { params: { site: string } }): Promise<MetadataRoute.Sitemap> {
  const { site } = await params
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const siteUrl = `${baseUrl}/${site}`

  const articles = await getArticles(site)
  const categories = await getCategories(site)

  // 1. Homepage
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
  ]

  // 2. Categories
  categories.forEach((cat: any) => {
    entries.push({
      url: `${siteUrl}?cat=${encodeURIComponent(cat.name)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    })
  })

  // 3. Articles
  articles.forEach((article: any) => {
    entries.push({
      url: `${siteUrl}/artikel/${article.slug}`,
      lastModified: new Date(article.publishedAt || article.updatedAt || new Date()),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  })

  return entries
}
