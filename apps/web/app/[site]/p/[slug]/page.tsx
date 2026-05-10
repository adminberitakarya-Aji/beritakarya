import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_MAP } from '@beritakarya/config'
import PublicSiteLayout from '../../../../components/layout/PublicSiteLayout'
import { constructMetadata } from '../../../../lib/metadata'

async function getSiteSettings(site: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/v1/sites/settings?site=${site}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch (e) {
    return null
  }
}

export async function generateMetadata({ params }: { params: { site: string; slug: string } }): Promise<Metadata> {
  const resolvedParams = await params
  const siteParam = resolvedParams.site
  const slug = resolvedParams.slug
  
  const titles: Record<string, string> = {
    about: 'Tentang Kami',
    ethics: 'Kode Etik',
    editorial: 'Redaksi',
    ads: 'Iklan'
  }

  const siteSettings = await getSiteSettings(siteParam)
  const siteName = siteSettings?.name || siteParam.charAt(0).toUpperCase() + siteParam.slice(1)

  return constructMetadata({
    title: `${titles[slug] || 'Informasi'} - ${siteName}`,
    siteParam
  })
}

export default async function InfoPage({ params }: { params: { site: string; slug: string } }) {
  const resolvedParams = await params
  const siteParam = resolvedParams.site
  const slug = resolvedParams.slug

  const siteSettings = await getSiteSettings(siteParam)
  
  const siteConfig = {
    id: siteParam,
    name: siteSettings?.name || (SITE_MAP[siteParam] as any)?.name || siteParam,
    logoUrl: siteSettings?.logoUrl || (SITE_MAP[siteParam] as any)?.logoUrl || null,
    address: siteSettings?.address || (SITE_MAP[siteParam] as any)?.address || null,
    contactEmail: siteSettings?.contactEmail || (SITE_MAP[siteParam] as any)?.contactEmail || null,
    appearance: siteSettings?.appearance || (SITE_MAP[siteParam] as any)?.appearance || { primaryColor: '#e11d48' },
    socialLinks: siteSettings?.socialLinks || (SITE_MAP[siteParam] as any)?.socialLinks || {}
  }

  const contentMap: Record<string, { title: string; content: string | null }> = {
    about: { title: 'Tentang Kami', content: siteSettings?.aboutUs },
    ethics: { title: 'Kode Etik', content: siteSettings?.codeOfEthics },
    editorial: { title: 'Redaksi', content: siteSettings?.editorial },
    ads: { title: 'Iklan', content: siteSettings?.advertising }
  }

  const info = contentMap[slug]
  if (!info) notFound()

  return (
    <PublicSiteLayout siteConfig={siteConfig as any}>
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-[1px] bg-brand-red"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red">Halaman Informasi</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-brand-black dark:text-white uppercase leading-none tracking-tight">
            {info.title}
          </h1>
        </div>

        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
          {info.content ? (
            <div className="whitespace-pre-wrap text-brand-text-muted leading-relaxed">
              {info.content}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 p-12 text-center rounded-sm">
              <p className="text-brand-text-muted italic text-sm">
                Konten belum tersedia untuk halaman ini. Silakan hubungi redaksi {siteConfig.name} untuk informasi lebih lanjut.
              </p>
            </div>
          )}
        </div>
      </div>
    </PublicSiteLayout>
  )
}
