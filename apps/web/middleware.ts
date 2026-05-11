// Re-export proxy sebagai default middleware Next.js
// config (matcher) harus ikut di-export agar Next.js tahu path mana yang diproses
export { proxy as default, config } from './proxy'