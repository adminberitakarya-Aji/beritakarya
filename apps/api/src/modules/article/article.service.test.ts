import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./article.repository')
vi.mock('@beritakarya/utils', () => ({
  generateSlug: (t: string) => t.toLowerCase().replace(/\s+/g, '-')
}))

import * as repo from './article.repository'
import {
  getArticleById, createArticle, updateArticle,
  publishArticle, deleteArticle
} from './article.service'
import type { JWTPayload } from '@beritakarya/types'

const jurnalisBandung: JWTPayload = {
  userId: 'u-1', role: 'journalist', siteId: 'bandung', iat: 0, exp: 0
}
const jurnalisSurabaya: JWTPayload = {
  userId: 'u-2', role: 'journalist', siteId: 'surabaya', iat: 0, exp: 0
}
const editorPusat: JWTPayload = {
  userId: 'u-3', role: 'pimred', siteId: null, iat: 0, exp: 0
}

const mockArticle = (overrides = {}) => ({
  id: 'art-1', title: 'Test', slug: 'test',
  siteId: 'bandung', authorId: 'u-1',
  blocks: [], status: 'draft',
  createdAt: new Date(), updatedAt: new Date(),
  ...overrides
})

describe('getArticleById — multi-site isolation', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('throw 404 jika artikel tidak ditemukan di site', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(null)
    const err = await getArticleById('art-1', 'surabaya').catch(e => e)
    expect(err.message).toContain('tidak ditemukan')
    expect(err.statusCode).toBe(404)
  })

  it('berhasil jika artikel ada di site yang benar', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(mockArticle() as any)
    const result = await getArticleById('art-1', 'bandung')
    expect(result.id).toBe('art-1')
  })
})

describe('createArticle — siteId injection', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('inject siteId dari request, bukan dari body', async () => {
    vi.mocked(repo.slugExists).mockResolvedValue(false)
    vi.mocked(repo.createArticle).mockResolvedValue(mockArticle() as any)

    await createArticle({ title: 'Artikel Baru' }, jurnalisBandung, 'bandung')

    expect(repo.createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'bandung', authorId: 'u-1' })
    )
  })

  it('generate slug unik jika slug sudah ada', async () => {
    vi.mocked(repo.slugExists)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
    vi.mocked(repo.createArticle).mockResolvedValue(mockArticle() as any)

    await createArticle({ title: 'Artikel Baru' }, jurnalisBandung, 'bandung')

    expect(repo.createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'artikel-baru-3' })
    )
  })
})

describe('updateArticle — ownership', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('journalist hanya bisa edit artikel miliknya', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(
      mockArticle({ authorId: 'user-lain' }) as any
    )
    const err = await updateArticle('art-1', 'bandung', { title: 'baru' }, jurnalisBandung).catch(e => e)
    expect(err.statusCode).toBe(403)
  })

  it('editor pusat bisa edit artikel siapapun', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(
      mockArticle({ authorId: 'user-lain' }) as any
    )
    vi.mocked(repo.slugExists).mockResolvedValue(false)
    vi.mocked(repo.updateArticle).mockResolvedValue(mockArticle() as any)

    await expect(
      updateArticle('art-1', 'bandung', { title: 'baru' }, editorPusat)
    ).resolves.not.toThrow()
  })
})

describe('publishArticle', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('set status published dan publishedAt', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(mockArticle() as any)
    vi.mocked(repo.updateArticle).mockResolvedValue(
      mockArticle({ status: 'published' }) as any
    )
    await publishArticle('art-1', 'bandung', jurnalisBandung)
    expect(repo.updateArticle).toHaveBeenCalledWith(
      'art-1', 'bandung',
      expect.objectContaining({ status: 'published', publishedAt: expect.any(Date) })
    )
  })
})

describe('deleteArticle — permission', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('journalist dari site lain tidak bisa delete', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(
      mockArticle({ authorId: 'u-1', siteId: 'bandung' }) as any
    )
    const err = await deleteArticle('art-1', 'bandung', jurnalisSurabaya).catch(e => e)
    expect(err.statusCode).toBe(403)
  })

  it('journalist bisa delete artikel miliknya sendiri', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(mockArticle() as any)
    vi.mocked(repo.deleteArticle).mockResolvedValue({} as any)
    await expect(deleteArticle('art-1', 'bandung', jurnalisBandung)).resolves.not.toThrow()
  })
})