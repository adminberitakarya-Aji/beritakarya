'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Save, Plus, X, Globe, Settings as SettingsIcon, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../../../store/authStore'
import { api } from '../../../../lib/api'

export default function SettingsPage() {
  const { site } = useParams() as { site: string }
  const { user } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [settings, setSettings] = useState({
    name: '',
    domain: '',
    description: '',
    logoUrl: '',
    footerText: '',
    address: '',
    contactEmail: '',
    phone: '',
    aboutUs: '',
    codeOfEthics: '',
    editorial: '',
    advertising: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: ''
    },
    appearance: {
      primaryColor: '#e11d48'
    },
    trendingTopics: [] as string[]
  })
  
  const [newTag, setNewTag] = useState('')

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/sites/settings')
      if (data.success) {
        setSettings({
          name: data.data.name || '',
          domain: data.data.domain || '',
          description: data.data.description || '',
          logoUrl: data.data.logoUrl || '',
          footerText: data.data.footerText || '',
          address: data.data.address || '',
          contactEmail: data.data.contactEmail || '',
          phone: data.data.phone || '',
          aboutUs: data.data.aboutUs || '',
          codeOfEthics: data.data.codeOfEthics || '',
          editorial: data.data.editorial || '',
          advertising: data.data.advertising || '',
          socialLinks: data.data.socialLinks || { facebook: '', twitter: '', instagram: '', youtube: '' },
          appearance: data.data.appearance || { primaryColor: '#e11d48' },
          trendingTopics: data.data.trendingTopics || []
        })
      }
    } catch (err) {
      console.error('Failed to fetch settings', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [site])
  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const { data } = await api.patch('/sites/settings', settings)
      if (data.success) {
        setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' })
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Gagal menyimpan pengaturan' })
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Terjadi kesalahan koneksi'
      setMessage({ type: 'error', text: msg })
    } finally {
      setSaving(false)
    }
  }

  const addTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim()) return
    if (settings.trendingTopics.includes(newTag.trim())) {
      setNewTag('')
      return
    }
    setSettings({
      ...settings,
      trendingTopics: [...settings.trendingTopics, newTag.trim()]
    })
    setNewTag('')
  }

  const removeTag = (tagToRemove: string) => {
    setSettings({
      ...settings,
      trendingTopics: settings.trendingTopics.filter(t => t !== tagToRemove)
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Memuat Pengaturan...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon size={16} className="text-brand-red" />
            <h1 className="text-2xl font-serif font-black tracking-tight text-brand-black dark:text-white uppercase">
              Pengaturan Situs
            </h1>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Kelola identitas dan topik hangat untuk portal <span className="text-brand-red">{site}</span>
          </p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-red hover:bg-brand-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-red/20 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      {message && (
        <div className={`p-4 flex items-center gap-3 rounded-sm border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-100 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400' 
            : 'bg-red-50 border-red-100 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-xs font-bold uppercase tracking-widest">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Identitas Situs */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-black/20 p-8 border border-gray-100 dark:border-white/5 rounded-sm shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-white mb-8 flex items-center gap-2">
              <Globe size={14} className="text-brand-red" /> Identitas Dasar
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Nama Situs / Portal</label>
                <input 
                  type="text" 
                  value={settings.name}
                  onChange={(e) => setSettings({...settings, name: e.target.value})}
                  placeholder="Contoh: BeritaKarya Bandung"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Domain Publik</label>
                <input 
                  type="text" 
                  value={settings.domain}
                  onChange={(e) => setSettings({...settings, domain: e.target.value})}
                  placeholder="bandung.beritakarya.co"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Deskripsi Situs (SEO)</label>
                <textarea 
                  value={settings.description}
                  onChange={(e) => setSettings({...settings, description: e.target.value})}
                  placeholder="Deskripsi singkat portal Anda untuk hasil pencarian Google..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium resize-none"
                />
              </div>
            </div>
          </section>

          {/* Branding & Visual */}
          <section className="bg-white dark:bg-black/20 p-8 border border-gray-100 dark:border-white/5 rounded-sm shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-white mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-red rounded-full"></span> Branding & Visual
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">URL Logo Situs</label>
                <input 
                  type="text" 
                  value={settings.logoUrl}
                  onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                  placeholder="https://.../logo.png"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Warna Utama (Brand Color)</label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    value={settings.appearance.primaryColor}
                    onChange={(e) => setSettings({
                      ...settings, 
                      appearance: { ...settings.appearance, primaryColor: e.target.value }
                    })}
                    className="w-12 h-10 bg-transparent border-none outline-none cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={settings.appearance.primaryColor}
                    onChange={(e) => setSettings({
                      ...settings, 
                      appearance: { ...settings.appearance, primaryColor: e.target.value }
                    })}
                    className="flex-1 bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-[10px] text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-mono"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Footer & Kontak */}
          <section className="bg-white dark:bg-black/20 p-8 border border-gray-100 dark:border-white/5 rounded-sm shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-white mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-red rounded-full"></span> Footer & Informasi Kontak
            </h2>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Teks Footer (Copyright/Info)</label>
                <input 
                  type="text" 
                  value={settings.footerText}
                  onChange={(e) => setSettings({...settings, footerText: e.target.value})}
                  placeholder="© 2024 BeritaKarya. All rights reserved."
                  className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Alamat Kantor</label>
                  <input 
                    type="text" 
                    value={settings.address}
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    placeholder="Jl. Merdeka No. 123, Jakarta"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Email Kontak</label>
                  <input 
                    type="email" 
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                    placeholder="support@beritakarya.co"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Nomor Telepon/WA</label>
                  <input 
                    type="text" 
                    value={settings.phone}
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                    placeholder="+62 812 3456 7890"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-white/5">
                {Object.keys(settings.socialLinks).map((key) => (
                  <div key={key} className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 capitalize">{key} URL</label>
                    <input 
                      type="text" 
                      value={(settings.socialLinks as any)[key]}
                      onChange={(e) => setSettings({
                        ...settings, 
                        socialLinks: { ...settings.socialLinks, [key]: e.target.value }
                      })}
                      placeholder={`https://${key}.com/yourprofile`}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-2 text-[10px] text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Halaman Informasi Portal */}
          <section className="bg-white dark:bg-black/20 p-8 border border-gray-100 dark:border-white/5 rounded-sm shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-white mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-red rounded-full"></span> Halaman Informasi Portal
            </h2>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Tentang Kami</label>
                <textarea 
                  value={settings.aboutUs}
                  onChange={(e) => setSettings({...settings, aboutUs: e.target.value})}
                  placeholder="Ceritakan sejarah dan visi misi portal Anda..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Kode Etik</label>
                <textarea 
                  value={settings.codeOfEthics}
                  onChange={(e) => setSettings({...settings, codeOfEthics: e.target.value})}
                  placeholder="Standar jurnalisme dan etika profesi di portal Anda..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Redaksi</label>
                <textarea 
                  value={settings.editorial}
                  onChange={(e) => setSettings({...settings, editorial: e.target.value})}
                  placeholder="Daftar tim redaksi dan penanggung jawab..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Informasi Iklan</label>
                <textarea 
                  value={settings.advertising}
                  onChange={(e) => setSettings({...settings, advertising: e.target.value})}
                  placeholder="Informasi tarif dan cara beriklan di portal Anda..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
                />
              </div>
            </div>
          </section>

          {/* Topik Hangat Editor */}
          <section className="bg-white dark:bg-black/20 p-8 border border-gray-100 dark:border-white/5 rounded-sm shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-red rounded-full"></span> Topik Hangat (Trending)
              </h2>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                {settings.trendingTopics.length} Topik Aktif
              </span>
            </div>

            <form onSubmit={addTag} className="flex gap-2 mb-8">
              <input 
                type="text" 
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Tambah topik baru (misal: Pilkada 2024)"
                className="flex-1 bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-4 py-3 text-xs text-brand-black dark:text-white outline-none focus:border-brand-red transition-colors font-medium"
              />
              <button 
                type="submit"
                className="bg-brand-black dark:bg-white/10 hover:bg-brand-red text-white px-4 py-3 transition-all rounded-sm"
              >
                <Plus size={18} />
              </button>
            </form>

            <div className="flex flex-wrap gap-3">
              {settings.trendingTopics.length > 0 ? (
                settings.trendingTopics.map((tag) => (
                  <div 
                    key={tag}
                    className="group flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-sm transition-all hover:border-brand-red"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-black dark:text-white">#{tag}</span>
                    <button 
                      onClick={() => removeTag(tag)}
                      className="text-gray-400 hover:text-brand-red transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="w-full py-10 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Belum ada topik khusus. Situs akan menggunakan topik default pusat.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-brand-black dark:bg-black/40 p-8 text-white rounded-sm shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <h3 className="text-lg font-serif font-bold mb-4 relative z-10">Tips Pengaturan</h3>
            <ul className="text-[10px] font-bold text-gray-400 space-y-4 uppercase tracking-[0.1em] leading-relaxed relative z-10">
              <li className="flex gap-2">
                <span className="text-brand-red">01.</span>
                <span>Nama situs akan muncul di Meta Title SEO dan Footer portal.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-red">02.</span>
                <span>Topik hangat akan muncul di sidebar homepage sebagai shortcut pencarian.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-red">03.</span>
                <span>Gunakan topik yang spesifik dan relevan dengan daerah Anda untuk meningkatkan engagement.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Floating/Bottom Action Bar */}
      <div className="sticky bottom-8 z-30 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 bg-brand-red hover:bg-brand-black text-white px-8 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-brand-red/40 disabled:opacity-50 rounded-sm border border-white/10"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Sedang Menyimpan...' : 'Simpan Seluruh Perubahan'}
        </button>
      </div>
    </div>
  )
}
