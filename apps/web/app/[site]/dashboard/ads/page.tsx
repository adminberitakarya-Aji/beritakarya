'use client'

import { useState, useEffect } from 'react'
import { api } from '../../../../lib/api'
import { useAuthStore } from '../../../../store/authStore'
import { useParams } from 'next/navigation'

interface Ad {
  id: string
  slot: string
  code: string | null
  isActive: boolean
}

const SLOTS = [
  { id: 'leaderboard', name: 'Top Billboard / Leaderboard (970x250 / 728x90)', desc: 'Tampil di bagian paling atas Halaman Utama dan Artikel.' },
  { id: 'in_feed', name: 'In-Feed Banner (300x250)', desc: 'Disisipkan secara alami setelah paragraf ke-3 di dalam teks artikel.' }
]

export default function AdsDashboard() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(false)
  const { site } = useParams() as { site: string }
  const { user } = useAuthStore()

  const fetchAds = async () => {
    try {
      const { data } = await api.get(`/ads?site=${site}`)
      setAds(data.data)
    } catch (error) {
      console.error('Gagal mengambil data iklan', error)
    }
  }

  useEffect(() => {
    fetchAds()
  }, [site])

  const handleSave = async (slotId: string, code: string, isActive: boolean) => {
    setLoading(true)
    try {
      await api.post(`/ads?site=${site}`, { slot: slotId, code, isActive })
      alert('Pengaturan iklan berhasil disimpan!')
      fetchAds()
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Gagal menyimpan iklan')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'superadmin' && user?.role !== 'pimred') {
    return <div className="p-8 text-center text-red-500">Akses Ditolak: Khusus Pimred & Superadmin</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold mb-2">Manajemen Iklan (Ad Slots)</h1>
        <p className="text-gray-500">Masukkan script Google AdSense atau tag iklan Anda di sini. Kosongkan jika ingin dinonaktifkan.</p>
      </div>

      <div className="space-y-8">
        {SLOTS.map(slot => {
          const currentAd = ads.find(a => a.slot === slot.id)
          return <AdSlotCard key={slot.id} slot={slot} currentAd={currentAd} onSave={handleSave} loading={loading} />
        })}
      </div>
    </div>
  )
}

function AdSlotCard({ slot, currentAd, onSave, loading }: { slot: any, currentAd: Ad | undefined, onSave: any, loading: boolean }) {
  const [code, setCode] = useState(currentAd?.code || '')
  const [isActive, setIsActive] = useState(currentAd ? currentAd.isActive : true)

  useEffect(() => {
    if (currentAd) {
      setCode(currentAd.code || '')
      setIsActive(currentAd.isActive)
    }
  }, [currentAd])

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{slot.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{slot.desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-600">Status:</span>
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`w-12 h-6 rounded-full transition-colors relative ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isActive ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">HTML / JS Script Code</label>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          rows={5}
          placeholder="<!-- Paste kode Google AdSense atau iframe di sini -->"
          className="w-full font-mono text-sm p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
        />
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => onSave(slot.id, code, isActive)}
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Menyimpan...' : 'Simpan Slot Iklan'}
        </button>
      </div>
    </div>
  )
}
