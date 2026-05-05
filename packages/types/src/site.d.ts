export interface Site {
    id: string;
    name: string;
    domain: string;
    createdAt: Date;
    updatedAt: Date;
}
export type SiteId = string;
export declare const SITE_IDS: readonly ["bandung", "surabaya"];
export type KnownSiteId = typeof SITE_IDS[number];
//# sourceMappingURL=site.d.ts.map