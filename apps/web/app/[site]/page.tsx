import { SITE_MAP } from '@beritakarya/config'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { constructMetadata } from '../../lib/metadata'
import { SiteHomePage } from '../../components/pages/SiteHomePage'

export async function generateMetadata({ params }: { params: { site: string } }): Promise<Metadata> {
  const resolvedParams = await params;
  const siteParam = resolvedParams?.site || 'pusat';
  
  // Fetch site settings for SEO
  let siteName = siteParam.charAt(0).toUpperCase() + siteParam.slice(1);
  let description = `Portal berita resmi ${siteName}. Menyajikan informasi terbaru, investigasi, dan analisis tajam dari seluruh Nusantara.`;
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/v1/sites/settings?site=${siteParam}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        siteName = json.data.name || siteName;
        description = json.data.description || description;
      }
    }
  } catch (e) {
    console.error('Error fetching metadata settings:', e);
  }

  return constructMetadata({
    title: `${siteName} - Berita Terkini & Terpercaya`,
    description,
    siteParam
  })
}

export default async function SitePage({
  params,
  searchParams,
}: {
  params: { site: string }
  searchParams: { cat?: string; q?: string }
}) {
  const resolvedParams = await params;
  const siteParam = resolvedParams?.site || 'pusat';
  const resolvedSearchParams = await searchParams;

  return <SiteHomePage siteParam={siteParam} searchParams={resolvedSearchParams} />
}

