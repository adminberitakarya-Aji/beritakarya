'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClipboardCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Eye,
  RefreshCw,
  Clock
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { cn } from '../../../../../lib/utils'

interface KYCUser {
  id: string
  name: string
  email: string
  role: string
  isVerified: boolean
  kycSubmittedAt: string | null
  kycReviewedAt: string | null
  kycNotes: string | null
}

export default function KYCReviewPage() {
  const params = useParams()
  const siteId = params.site as string
  const router = useRouter()

  const [users, setUsers] = useState<KYCUser[]>([])
  const [stats, setStats] = useState({ totalPending: 0, approvedThisWeek: 0, rejectedThisWeek: 0, avgApprovalTime: 0, conversionRate: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 20, page: 1 })

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/kyc/stats?site=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch KYC stats:', err)
    }
  }

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/kyc`, {
        params: {
          site: siteId,
          page,
          limit: 20,
          search,
          status: filter
        },
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setUsers(response.data.data)
        setMeta(response.data.meta)
      }
    } catch (err) {
      console.error('Failed to fetch KYC users:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [siteId, page, filter]) // Removed 'search' from deps to avoid excessive API calls while typing

  // Debounced search could be added here, but for now we'll use a search button or manual trigger
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const statCards = [
    { label: 'Menunggu', value: stats.totalPending, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Disetujui (7h)', value: stats.approvedThisWeek, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Ditolak (7h)', value: stats.rejectedThisWeek, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Rata-rata Waktu', value: `${stats.avgApprovalTime} Jam`, color: 'text-slate-600', bg: 'bg-slate-50' }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck size={14} className="text-brand-red" />
            <span className="text-[10px] font-black text-brand-red uppercase tracking-widest">Verifikasi Identitas</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Antrian KYC</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tinjau pengajuan identitas dari pembaca untuk menjadi jurnalis.
          </p>
        </div>
        <button
          onClick={() => { fetchUsers(true); fetchStats(); }}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={cn("p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900")}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{card.label}</p>
            <p className={cn("text-2xl font-black tracking-tight", card.color)}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Stats & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama atau email... (Enter)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-brand-red/30 transition-all text-sm shadow-sm"
            />
          </form>
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
            {(['pending', 'verified', 'rejected', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setFilter(t); setPage(1); }}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  filter === t 
                    ? "bg-brand-red text-white shadow-lg shadow-brand-red/20" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                )}
              >
                {t === 'pending' ? 'Menunggu' : t === 'verified' ? 'Disetujui' : t === 'rejected' ? 'Ditolak' : 'Semua'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table/List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm shadow-slate-200/50 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pengaju</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tgl Pengajuan</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tgl Review</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-red mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Memuat data...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Tidak ada pengajuan ditemukan</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold group-hover:bg-brand-red group-hover:text-white transition-colors">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {user.isVerified ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                          <CheckCircle2 size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Terverifikasi</span>
                        </div>
                      ) : user.kycSubmittedAt ? (
                        user.kycNotes?.includes('REJECTED') ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                            <XCircle size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Ditolak</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                            <Clock size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Menunggu</span>
                          </div>
                        )
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                          <AlertCircle size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Belum Diajukan</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {user.kycSubmittedAt ? new Date(user.kycSubmittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {user.kycReviewedAt ? new Date(user.kycReviewedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link 
                        href={`/${siteId}/dashboard/review/kyc/${user.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-red transition-all shadow-lg shadow-slate-200/50 dark:shadow-none"
                      >
                        <Eye size={12} /> Tinjau
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Halaman {meta.page} dari {meta.totalPages} ({meta.total} Total)
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 transition-all shadow-sm"
              >
                Sebelumnya
              </button>
              <button
                disabled={page === meta.totalPages || loading}
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 transition-all shadow-sm"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

