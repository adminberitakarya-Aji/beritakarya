import { callAI } from './base.service'
import OpenAI from 'openai'
import type { AIResult } from './base.service'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30_000,
})

export interface CaptionResult {
  caption: string
  altText: string
}

export async function generateCaption(
  imageUrl: string
): Promise<AIResult<CaptionResult>> {
  return callAI(async () => {
    const res = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Deskripsikan gambar ini untuk caption berita dan alt text.
Kembalikan JSON: {"caption":"kalimat caption singkat max 100 karakter","altText":"deskripsi singkat untuk aksesibilitas"}
Gunakan bahasa Indonesia. Kembalikan HANYA JSON.`
          },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } }
        ]
      }]
    })
    const raw = res.choices[0]?.message?.content?.trim() ?? ''
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim())
    if (!result.caption) throw new Error('Format tidak valid')
    return result
  })
}