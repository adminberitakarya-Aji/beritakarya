'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Shield, Sparkles, AlertTriangle } from 'lucide-react'

export function AIConsentModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleRequired = () => setOpen(true)
    window.addEventListener('ai:consent:required', handleRequired)
    return () => window.removeEventListener('ai:consent:required', handleRequired)
  }, [])

  const handleConsent = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/ai/consent')
      if (data.success) {
        setOpen(false)
        // Optionally notify user to retry
      } else {
        setError('Gagal memproses persetujuan. Coba lagi.')
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in">
        <div className="p-6 bg-brand-surface border-b border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-black">Persetujuan Penggunaan AI</h3>
            <p className="text-xs text-gray-500 mt-1">BeritaKarya AI Assistant</p>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Untuk menggunakan fitur AI (Rewrite, Optimize, Grammar, dll), Anda harus menyetujui kebijakan penggunaan AI kami:
          </p>
          
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm text-gray-600">
              <Shield className="text-brand-red shrink-0" size={18} />
              <span>AI hanya bersifat asistif. Tanggung jawab jurnalistik tetap berada pada penulis.</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-600">
              <AlertTriangle className="text-amber-500 shrink-0" size={18} />
              <span>Dilarang keras memasukkan data pribadi sensitif atau informasi rahasia ke dalam prompt AI.</span>
            </li>
          </ul>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg mt-4">{error}</p>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={() => setOpen(false)}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-brand-black transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConsent}
            disabled={loading}
            className="px-5 py-2 bg-brand-red text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? 'Memproses...' : 'Saya Setuju'}
          </button>
        </div>
      </div>
    </div>
  )
}
