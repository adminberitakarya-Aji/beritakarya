import { SITE_MAP } from '@beritakarya/config'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { constructMetadata } from '../../lib/metadata'
import { SiteHomePage } from '../../components/pages/SiteHomePage'

export async function generateMetadata({ params }: { params: { site: string } }): Promise<Metadata> {
  const resolvedParams = await params;
  const siteParam = resolvedParams?.site || 'pusat';
  const siteConfig = SITE_MAP[siteParam] || SITE_MAP['pusat'];
  const siteName = siteConfig?.name || (siteParam.charAt(0).toUpperCase() + siteParam.slice(1));

  return constructMetadata({
    title: `${siteName} - Berita Terkini & Terpercaya`,
    description: `Portal berita resmi ${siteName}. Menyajikan informasi terbaru, investigasi, dan analisis tajam dari seluruh Nusantara.`,
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

