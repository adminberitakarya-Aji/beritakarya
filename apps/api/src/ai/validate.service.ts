import { callAI, chatComplete } from './base.service'
import type { AIResult } from './base.service'

export interface GrammarCorrection {
  original: string
  suggestion: string
  reason: string
}

export interface GrammarResult {
  corrections: GrammarCorrection[]
  totalIssues: number
}

export interface ReadabilityResult {
  score: number
  level: 'SD' | 'SMP' | 'SMA' | 'Perguruan Tinggi' | 'Profesional'
  summary: string
  suggestions: string[]
}

function extractJSON<T>(raw: string): T {
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

export async function checkGrammar(
  text: string
): Promise<AIResult<GrammarResult>> {
  return callAI(async () => {
    const raw = await chatComplete(
      `Kamu adalah editor bahasa Indonesia.
Temukan kesalahan grammar, ejaan, dan tanda baca dalam teks berikut.
Kembalikan HANYA JSON:
{"corrections":[{"original":"kata salah","suggestion":"kata benar","reason":"alasan singkat"}],"totalIssues":N}
Jika tidak ada kesalahan, kembalikan: {"corrections":[],"totalIssues":0}`,
      `Teks yang harus dicek:
"${text.slice(0, 2000)}"`,
      { temperature: 0.2 }
    )
    const result = extractJSON<GrammarResult>(raw)
    return {
      corrections: result.corrections || [],
      totalIssues: result.totalIssues || 0
    }
  })
}

export async function checkReadability(
  text: string
): Promise<AIResult<ReadabilityResult>> {
  return callAI(async () => {
    const raw = await chatComplete(
      `Kamu adalah ahli linguistik dan keterbacaan teks bahasa Indonesia.
Analisis keterbacaan teks berikut.
Kembalikan HANYA JSON:
{
  "score": 0-100,
  "level": "SD"|"SMP"|"SMA"|"Perguruan Tinggi"|"Profesional",
  "summary": "penjelasan singkat 1 kalimat",
  "suggestions": ["saran1","saran2","saran3"]
}`,
      `Teks:
"${text.slice(0, 2000)}"`,
      { temperature: 0.3 }
    )
    const result = extractJSON<ReadabilityResult>(raw)
    if (typeof result.score !== 'number') throw new Error('Format tidak valid')
    return result
  })
}