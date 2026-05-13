import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import { api } from '../lib/api'

vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn()
  }
}))

const mockResponse = {
  data: {
    success: true,
    data: {
      accessToken:  'access-token-123',
      refreshToken: 'refresh-token-456',
      user: {
        id: 'u-1', email: 'test@bandung.com',
        name: 'Test', role: 'journalist', siteId: 'bandung',
        isVerified: false, kycSubmittedAt: null
      }
    }
  }
}

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAuthStore.setState({ user: null, isLoading: false, error: null })
  })

  it('login menyimpan token ke localStorage dan set user', async () => {
    vi.mocked(api.post).mockResolvedValue(mockResponse)

    await useAuthStore.getState().login('test@bandung.com', 'password123')

    expect(localStorage.getItem('accessToken')).toBe('access-token-123')
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token-456')
    expect(useAuthStore.getState().user?.email).toBe('test@bandung.com')
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('login gagal set error state dan tidak simpan token', async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { data: { error: { message: 'Email atau password salah' } } }
    })

    await useAuthStore.getState().login('test@bandung.com', 'salah').catch(() => {})

    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().error).toBe('Email atau password salah')
  })

  it('logout menghapus token dari localStorage', async () => {
    localStorage.setItem('accessToken',  'access-token')
    localStorage.setItem('refreshToken', 'refresh-token')
    useAuthStore.setState({ user: { id: 'u-1', email: 'x', name: 'x', role: 'journalist', siteId: 'bandung', isVerified: false, kycSubmittedAt: null } })
    vi.mocked(api.post).mockResolvedValue({ data: {} })

    await useAuthStore.getState().logout()

    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
