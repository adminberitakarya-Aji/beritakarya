import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../lib/api'
import type { AuthUser } from '@beritakarya/types'

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      const { accessToken, refreshToken, user } = data.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      set({ user, isLoading: false })
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Login gagal'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/register', { name, email, password })
      const { accessToken, refreshToken, user } = data.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      set({ user, isLoading: false })
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Pendaftaran gagal'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    const userId = get().user?.id
    if (userId && refreshToken) {
      await api.post('/auth/logout', { userId, refreshToken }).catch(() => {})
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null })
  },

  clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)