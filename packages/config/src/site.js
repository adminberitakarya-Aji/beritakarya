"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KNOWN_SITE_IDS = exports.SITE_MAP = void 0;
exports.getSiteFromHostname = getSiteFromHostname;
exports.SITE_MAP = {
    bandung: {
        id: 'bandung',
        name: 'BeritaKarya Bandung',
        domain: 'bandung.beritakarya.com',
        devDomain: 'bandung.localhost:3000'
    },
    surabaya: {
        id: 'surabaya',
        name: 'BeritaKarya Surabaya',
        domain: 'surabaya.beritakarya.com',
        devDomain: 'surabaya.localhost:3000'
    }
};
function getSiteFromHostname(hostname) {
    const subdomain = hostname.split('.')[0];
    return exports.SITE_MAP[subdomain] ?? null;
}
exports.KNOWN_SITE_IDS = Object.keys(exports.SITE_MAP);
//# sourceMappingURL=site.js.map