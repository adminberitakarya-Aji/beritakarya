import { Metadata } from 'next'

export function constructMetadata({
  title = 'BeritaKarya — Portal Berita Terpercaya',
  description = 'Informasi terkini dan terpercaya dari berbagai penjuru daerah.',
  image = '/logo.png',
  icons = '/favicon.ico',
  noIndex = false,
  siteParam = 'pusat',
  slug = '',
}: {
  title?: string
  description?: string
  image?: string
  icons?: string
  noIndex?: boolean
  siteParam?: string
  slug?: string
} = {}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const url = slug 
    ? `${baseUrl}/${siteParam}/artikel/${slug}`
    : `${baseUrl}/${siteParam}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'BeritaKarya',
      locale: 'id_ID',
      type: slug ? 'article' : 'website',
      images: [
        {
          url: image,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@beritakarya',
    },
    icons,
    metadataBase: new URL(baseUrl),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  }
}
