'use client'

import { useState, useEffect } from 'react'
import { api } from '../../../../lib/api'
import { useAuthStore } from '../../../../store/authStore'
import { useParams } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
}

export default function CategoriesDashboard() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { site } = useParams() as { site: string }
  const { user } = useAuthStore()

  useEffect(() => {
    fetchCategories()
  }, [site])

  const fetchCategories = async () => {
    try {
      const { data } = await api.get(`/categories?site=${site}`)
      setCategories(data.data)
    } catch (error) {
      console.error('Gagal mengambil kategori', error)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await api.post(`/categories?site=${site}`, { name })
      setName('')
      fetchCategories()
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Gagal membuat kategori')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return
    try {
      await api.delete(`/categories/${id}?site=${site}`)
      fetchCategories()
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Gagal menghapus kategori')
    }
  }

  if (user?.role !== 'superadmin' && user?.role !== 'pimred') {
    return <div className="p-8 text-center text-red-500">Akses Ditolak: Khusus Pimred & Superadmin</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif font-bold mb-8">Manajemen Kategori</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Tambah Kategori Baru</h2>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Misal: Politik, Olahraga, Kriminal..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Tambah'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Kategori</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug URL</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">Belum ada kategori.</td></tr>
            ) : categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900">{cat.name}</td>
                <td className="px-6 py-4 text-gray-500 font-mono text-sm">/{cat.slug}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-semibold"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
