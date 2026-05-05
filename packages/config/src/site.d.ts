export interface SiteConfig {
    id: string;
    name: string;
    domain: string;
    devDomain: string;
}
export declare const SITE_MAP: Record<string, SiteConfig>;
export declare function getSiteFromHostname(hostname: string): SiteConfig | null;
export declare const KNOWN_SITE_IDS: string[];
//# sourceMappingURL=site.d.ts.map