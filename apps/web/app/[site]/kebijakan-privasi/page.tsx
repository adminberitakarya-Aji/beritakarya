'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Eye, Trash2, CheckCircle2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function PrivacyPolicyPage() {
  const params = useParams()
  const siteId = params.site as string

  const sections = [
    {
      icon: <Eye className="w-6 h-6 text-blue-500" />,
      title: 'Data yang Kami Kumpulkan',
      content: 'Untuk keperluan verifikasi identitas (KYC), kami mengumpulkan data berupa Foto KTP, Foto Kartu Keluarga (opsional), dan biografi singkat. Data ini diperlukan untuk memastikan akuntabilitas penulis di platform BeritaKarya.'
    },
    {
      icon: <Lock className="w-6 h-6 text-red-500" />,
      title: 'Keamanan & Perlindungan',
      content: 'Semua dokumen identitas yang diunggah secara otomatis diberi watermark digital bertuliskan "HANYA UNTUK VERIFIKASI BERITAKARYA" untuk mencegah penyalahgunaan. Data disimpan di server terenkripsi dengan akses terbatas.'
    },
    {
      icon: <Shield className="w-6 h-6 text-green-500" />,
      title: 'Akses & Penggunaan',
      content: 'Data identitas Anda hanya dapat dilihat oleh Superadmin dan Wakil Pemimpin Redaksi (Wapimred) di situs tempat Anda mendaftar. Setiap akses ke dokumen Anda dicatat dalam log audit (audit trail) untuk keamanan.'
    },
    {
      icon: <Trash2 className="w-6 h-6 text-orange-500" />,
      title: 'Retensi & Penghapusan',
      content: 'Sesuai dengan kebijakan regulasi, kami menyimpan data verifikasi selama 5 (lima) tahun sejak tanggal pengajuan atau selama akun Anda aktif sebagai jurnalis. Setelah masa tersebut, data akan dihapus atau dianonimkan secara permanen.'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            href={`/${siteId}/dashboard`}
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-10 text-white text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl font-bold tracking-tight">Kebijakan Perlindungan Data KYC</h1>
            <p className="mt-2 text-blue-100 opacity-90">
              Bagaimana kami menjaga dan melindungi informasi identitas Anda di BeritaKarya.
            </p>
          </div>

          <div className="px-8 py-10 space-y-12">
            <section className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p className="text-lg leading-relaxed">
                BeritaKarya berkomitmen untuk melindungi privasi dan keamanan data pribadi Anda. Halaman ini menjelaskan praktik kami terkait pengumpulan, penggunaan, dan perlindungan data Identitas (KYC) yang Anda berikan.
              </p>
            </section>

            <div className="grid gap-8">
              {sections.map((section, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-5"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      {section.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6">
              <div className="flex gap-3">
                <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300">Persetujuan Anda</h4>
                  <p className="mt-1 text-sm text-blue-800 dark:text-blue-400 opacity-90 leading-relaxed">
                    Dengan mengunggah dokumen identitas, Anda memberikan persetujuan eksplisit kepada kami untuk memproses data tersebut sesuai dengan tujuan verifikasi jurnalis dan kebijakan yang tertera di atas.
                  </p>
                </div>
              </div>
            </div>

            <footer className="pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-sm text-slate-500">
              <p>Terakhir diperbarui: 13 Mei 2026</p>
              <p className="mt-1">Jika Anda memiliki pertanyaan, silakan hubungi tim dukungan kami.</p>
            </footer>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
