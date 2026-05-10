export interface SiteConfig {
  id: string
  name: string
  domain: string
  description?: string
  logoUrl?: string
  footerText?: string
  socialLinks?: {
    facebook?: string
    twitter?: string
    instagram?: string
    youtube?: string
  }
  address?: string
  contactEmail?: string
  phone?: string
  aboutUs?: string
  codeOfEthics?: string
  editorial?: string
  advertising?: string
  appearance?: {
    primaryColor: string
  }
  devDomain: string
}

export const SITE_MAP: Record<string, SiteConfig> = {
  bandung: {
    id: 'bandung',
    name: 'BeritaKarya Bandung',
    domain: 'bandung.beritakarya.co',
    devDomain: 'bandung.localhost:3000'
  },
  surabaya: {
    id: 'surabaya',
    name: 'BeritaKarya Surabaya',
    domain: 'surabaya.beritakarya.co',
    devDomain: 'surabaya.localhost:3000'
  },
  pusat: {
    id: 'pusat',
    name: 'BeritaKarya Pusat',
    domain: 'beritakarya.co',
    devDomain: 'localhost:3000'
  }
}

export function getSiteFromHostname(
  hostname: string
): SiteConfig | null {
  const subdomain = hostname.split('.')[0]
  return SITE_MAP[subdomain] ?? null
}

export const KNOWN_SITE_IDS = Object.keys(SITE_MAP)