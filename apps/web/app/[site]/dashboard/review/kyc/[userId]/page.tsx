'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle,
  FileText,
  Eye,
  Lock
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { cn } from '../../../../../../lib/utils'

interface KYCUser {
  id: string
  name: string
  email: string
  role: string
  bio: string | null
  isVerified: boolean
  kycSubmittedAt: string | null
  kycReviewedAt: string | null
  kycNotes: string | null
  idCardPath: string | null
  familyCardPath: string | null
}

export default function KYCDetailReviewPage() {
  const params = useParams()
  const siteId = params.site as string
  const userId = params.userId as string
  const router = useRouter()

  const [user, setUser] = useState<KYCUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showImage, setShowImage] = useState<string | null>(null)

  const fetchUser = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/kyc/${userId}?site=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setUser(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch user KYC data:', err)
      setError('Gagal memuat data pengguna')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [userId, siteId])

  const handleVerify = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !notes) {
      setError('Catatan alasan wajib diisi jika menolak pengajuan')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/kyc/${userId}/verify?site=${siteId}`, {
        status,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      router.push(`/${siteId}/dashboard/review/kyc`)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || `Gagal melakukan ${status}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-red mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Memuat berkas identitas...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold dark:text-white">User tidak ditemukan</h2>
        <Link href={`/${siteId}/dashboard/review/kyc`} className="mt-4 text-brand-red font-bold uppercase tracking-widest text-xs">
          Kembali ke Antrian
        </Link>
      </div>
    )
  }

  const getFileUrl = (type: 'idCard' | 'familyCard') => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const token = localStorage.getItem('accessToken')
    return `${baseUrl}/api/v1/kyc/view/${userId}/${type}?site=${siteId}&token=${token}`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Back & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <Link 
            href={`/${siteId}/dashboard/review/kyc`}
            className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-brand-red transition-colors mb-2"
          >
            <ArrowLeft className="w-3 h-3 mr-1" /> Kembali ke Antrian
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Tinjau Identitas: {user.name}
          </h1>
          <p className="text-xs text-slate-500">ID: {user.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Review Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Documents Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Foto KTP (Watermarked)</label>
              <div 
                className="group relative aspect-[3/2] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 cursor-zoom-in"
                onClick={() => setShowImage('idCard')}
              >
                {user.idCardPath ? (
                  <img src={getFileUrl('idCard')} alt="KTP" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <FileText size={40} strokeWidth={1} />
                    <p className="text-[10px] font-bold mt-2 uppercase tracking-widest">Tidak ada file</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="text-white w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kartu Keluarga (Opsi)</label>
              <div 
                className="group relative aspect-[3/2] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 cursor-zoom-in"
                onClick={() => user.familyCardPath && setShowImage('familyCard')}
              >
                {user.familyCardPath ? (
                  <img src={getFileUrl('familyCard')} alt="KK" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <FileText size={40} strokeWidth={1} />
                    <p className="text-[10px] font-bold mt-2 uppercase tracking-widest">Tidak ada file</p>
                  </div>
                )}
                {user.familyCardPath && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="text-white w-8 h-8" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Bio */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Biografi Penulis</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
              &ldquo;{user.bio || 'Pengguna tidak memberikan biografi.'}&rdquo;
            </p>
          </div>
        </div>

        {/* Sidebar Action Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-red" /> Panel Keputusan
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Catatan Review</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Berikan alasan jika ditolak atau catatan tambahan jika disetujui..."
                  className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs outline-none focus:border-brand-red/30 transition-all resize-none dark:text-white"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  disabled={submitting}
                  onClick={() => handleVerify('approved')}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Setujui Verifikasi
                </button>
                <button
                  disabled={submitting}
                  onClick={() => handleVerify('rejected')}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Tolak Pengajuan
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red mb-4">Informasi Keamanan</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-[11px] text-slate-300 leading-relaxed">Setiap tampilan dokumen identitas dicatat dalam audit trail untuk keamanan data pengguna.</p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-[11px] text-slate-300 leading-relaxed">Persetujuan akan secara otomatis mempromosikan peran pengguna menjadi Jurnalis.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <img 
                src={getFileUrl(showImage as any)} 
                alt="Document Preview" 
                className="w-full h-auto rounded-lg shadow-2xl border border-white/10"
              />
              <button 
                onClick={() => setShowImage(null)}
                className="absolute -top-12 right-0 text-white flex items-center gap-2 font-black uppercase tracking-widest text-[10px] hover:text-brand-red transition-colors"
              >
                <XCircle className="w-5 h-5" /> Tutup Preview
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
