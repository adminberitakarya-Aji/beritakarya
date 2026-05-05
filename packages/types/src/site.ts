export interface Site {
  id: string
  name: string
  domain: string
  createdAt: Date
  updatedAt: Date
}

export type SiteId = string

export const SITE_IDS = ['bandung', 'surabaya'] as const
export type KnownSiteId = typeof SITE_IDS[number]