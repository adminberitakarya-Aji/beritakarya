"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.formatRelativeTime = formatRelativeTime;
exports.truncate = truncate;
exports.wordCount = wordCount;
function formatDate(date, locale = 'id-ID') {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}
function formatRelativeTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const diff = Date.now() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1)
        return 'Baru saja';
    if (minutes < 60)
        return `${minutes} menit lalu`;
    if (hours < 24)
        return `${hours} jam lalu`;
    if (days < 7)
        return `${days} hari lalu`;
    return formatDate(d);
}
function truncate(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength).trim() + '...';
}
function wordCount(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}
//# sourceMappingURL=format.js.map