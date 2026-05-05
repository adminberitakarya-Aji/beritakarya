import { callAI, chatComplete } from './base.service'
import type { AIResult } from './base.service'

type Tone = 'formal' | 'santai' | 'berita'
type Length = 'lebih_pendek' | 'sama' | 'lebih_panjang'

const TONE_DESC: Record<Tone, string> = {
  formal: 'bahasa formal dan akademis',
  santai: 'bahasa santai dan mudah dipahami pembaca umum',
  berita: 'gaya penulisan berita Indonesia yang faktual, ringkas, dan objektif'
}

const LENGTH_DESC: Record<Length, string> = {
  lebih_pendek: 'lebih ringkas dari versi aslinya (kurangi 30-50%)',
  sama: 'panjang yang kurang lebih sama dengan versi aslinya',
  lebih_panjang: 'lebih elaborasi dari versi aslinya (tambah 30-50%)'
}

export async function rewriteBlock(
  content: string,
  tone: Tone = 'berita',
  length: Length = 'sama',
  context: { prev?: string; next?: string } = {}
): Promise<AIResult<string>> {
  return callAI(async () => {
    const result = await chatComplete(
      `Kamu adalah asisten penulisan untuk media berita Indonesia.
Tugasmu menulis ulang teks yang diberikan.
Gunakan ${TONE_DESC[tone]}.
Target panjang: ${LENGTH_DESC[length]}.
PENTING: Kembalikan HANYA teks baru tanpa penjelasan, tanpa tanda kutip, tanpa komentar.`,
      `${context.prev ? `Konteks sebelumnya: "${context.prev.slice(0, 200)}"

` : ''}Teks yang harus ditulis ulang:
"${content}"
${context.next ? `
Konteks setelahnya: "${context.next.slice(0, 200)}"` : ''}`
    )
    if (!result) throw new Error('AI mengembalikan respons kosong')
    return result
  })
}

export async function expandBlock(
  content: string,
  context: { prev?: string; next?: string } = {}
): Promise<AIResult<string>> {
  return callAI(async () => {
    const result = await chatComplete(
      `Kamu adalah asisten penulisan untuk media berita Indonesia.
Tugasmu mengembangkan dan memperluas paragraf yang diberikan.
Tambahkan detail, contoh, atau penjelasan yang relevan.
Pertahankan fakta yang sudah ada, jangan mengarang fakta baru.
Kembalikan HANYA teks yang sudah dikembangkan.`,
      `${context.prev ? `Konteks sebelumnya: "${context.prev.slice(0, 200)}"

` : ''}Paragraf yang harus dikembangkan:
"${content}"`
    )
    if (!result) throw new Error('AI mengembalikan respons kosong')
    return result
  })
}