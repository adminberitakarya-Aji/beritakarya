'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useAuthStore } from '../../../store/authStore'
import { 
  FileText, 
  Tag, 
  LayoutDashboard, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  ExternalLink,
  ChevronRight,
  Users as UsersIcon,
  Menu,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

import { useRouter } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { site } = useParams() as { site: string }
  const { user, logout } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Pastikan ini berjalan di client-side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
      } else if (user) {
        const allowedRoles = ['superadmin', 'pimred', 'journalist']
        if (!allowedRoles.includes(user.role)) {
          router.push('/')
        }
      }
    }
  }, [user, router])

  const navigation = [
    { name: 'Ringkasan', href: `/${site}/dashboard`, icon: LayoutDashboard, roles: ['superadmin', 'pimred', 'journalist'] },
    { name: 'Artikel', href: `/${site}/dashboard/articles`, icon: FileText, roles: ['superadmin', 'pimred', 'journalist'] },
    { name: 'Kategori', href: `/${site}/dashboard/categories`, icon: Tag, roles: ['superadmin', 'pimred'] },
    { name: 'Iklan & Banner', href: `/${site}/dashboard/ads`, icon: ImageIcon, roles: ['superadmin', 'pimred'] },
    { name: 'Tim Redaksi', href: `/${site}/dashboard/users`, icon: UsersIcon, roles: ['superadmin'] },
    { name: 'Pengaturan Situs', href: `/${site}/dashboard/settings`, icon: Settings, roles: ['superadmin', 'pimred'] },
  ]

  const filteredNav = navigation.filter(item => user && item.roles.includes(user.role))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a] flex flex-col md:flex-row font-sans text-brand-black dark:text-white transition-colors duration-500">
      
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-slate-900 dark:bg-black/40 text-white flex-shrink-0 flex flex-col hidden md:flex border-r border-transparent dark:border-white/5">
        <div className="p-8 border-b border-white/5">
          <Link href={`/${site}/dashboard`} className="flex flex-col">
            <h2 className="text-xl font-serif font-black tracking-tighter uppercase leading-none">
              ADMIN<span className="text-brand-red">.</span>
            </h2>
            <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-[0.2em] font-bold">CENTER</p>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 pt-8 space-y-1">
          <p className="px-4 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Utama</p>
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/${site}/dashboard` && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-sm transition-all duration-200 group",
                  isActive 
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-xs font-bold uppercase tracking-widest">{item.name}</span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-sm font-serif italic shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black truncate uppercase tracking-widest leading-tight">{user?.name}</span>
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">{user?.role}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all rounded-sm"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Navbar */}
      <div className="md:hidden bg-slate-900 dark:bg-black/40 text-white p-4 flex justify-between items-center sticky top-0 z-50 border-b border-transparent dark:border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h2 className="text-lg font-serif font-black uppercase tracking-tighter">ADMIN<span className="text-brand-red">.</span></h2>
        </div>
        <Link href={`/${site}`} target="_blank" className="p-2 text-brand-red">
          <ExternalLink size={20} />
        </Link>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900 dark:bg-[#0a0f1a] pt-20 px-6">
          <nav className="space-y-4">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== `/${site}/dashboard` && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 py-4 border-b border-white/5",
                    isActive ? "text-brand-red" : "text-gray-400"
                  )}
                >
                  <Icon size={20} />
                  <span className="text-sm font-bold uppercase tracking-widest">{item.name}</span>
                </Link>
              )
            })}
            <button onClick={logout} className="flex items-center gap-4 py-4 text-red-400 w-full">
              <LogOut size={20} />
              <span className="text-sm font-bold uppercase tracking-widest">Keluar</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white dark:bg-slate-900/50 border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-8 flex-shrink-0">
           <div className="flex flex-col">
             <h3 className="text-xs font-black uppercase tracking-[0.25em] text-brand-black dark:text-white">Admin Center</h3>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sistem Manajemen Konten BeritaKarya</p>
           </div>
           <Link 
            href={`/${site}`} 
            target="_blank" 
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all text-brand-black dark:text-white"
           >
             Lihat Portal <ExternalLink size={12} className="text-brand-red" />
           </Link>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>

    </div>
  )
}
