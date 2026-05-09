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
  X,
  Bell,
  Search,
  Moon,
  Sun,
  ClipboardCheck,
  BarChart3,
  Shield,
  Activity,
  ChevronDown,
  Calendar
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '../../../lib/utils'
import { useRouter } from 'next/navigation'
import NotificationBell from '../../../components/dashboard/NotificationBell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { site } = useParams() as { site: string }
  const { user, logout } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
      if (savedTheme) {
        setTheme(savedTheme)
        document.documentElement.classList.toggle('dark', savedTheme === 'dark')
      }
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
      } else if (user) {
        const allowedRoles = ['superadmin', 'pimred', 'journalist']
        if (!allowedRoles.includes(user.role)) {
          router.push(`/${site}`)
        }
      }
    }
  }, [user, router])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  // Navigation organized by section
  const navSections = [
    {
      label: 'Utama',
      items: [
        { name: 'Ringkasan', href: `/${site}/dashboard`, icon: LayoutDashboard, roles: ['superadmin', 'pimred', 'journalist'] },
        { name: 'Artikel', href: `/${site}/dashboard/articles`, icon: FileText, roles: ['superadmin', 'pimred', 'journalist'] },
        { name: 'Media', href: `/${site}/dashboard/media`, icon: ImageIcon, roles: ['superadmin', 'pimred', 'journalist'] },
      ]
    },
    {
      label: 'Editorial',
      items: [
        { name: 'Antrian Review', href: `/${site}/dashboard/review`, icon: ClipboardCheck, roles: ['superadmin', 'pimred'] },
        { name: 'Kalender', href: `/${site}/dashboard/calendar`, icon: Calendar, roles: ['superadmin', 'pimred'] },
        { name: 'Kategori', href: `/${site}/dashboard/categories`, icon: Tag, roles: ['superadmin', 'pimred'] },
        { name: 'Iklan & Banner', href: `/${site}/dashboard/ads`, icon: ImageIcon, roles: ['superadmin', 'pimred'] },
      ]
    },
    {
      label: 'Administrasi',
      items: [
        { name: 'Monitor Tim', href: `/${site}/dashboard/team`, icon: UsersIcon, roles: ['superadmin', 'pimred'] },
        { name: 'Audit Log', href: `/${site}/dashboard/audit`, icon: Shield, roles: ['superadmin', 'pimred'] },
        { name: 'Pengaturan', href: `/${site}/dashboard/settings`, icon: Settings, roles: ['superadmin', 'pimred'] },
      ]
    }
  ]

  const ROLE_LABELS: Record<string, string> = {
    superadmin: 'Superadmin',
    pimred: 'Pimpinan Redaksi',
    journalist: 'Wartawan',
  }

  const initials = user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1a] flex flex-col md:flex-row font-sans text-brand-black dark:text-white transition-colors duration-500">
      
      {/* Sidebar Desktop */}
      <aside className={cn(
        "bg-slate-900 dark:bg-[#050a15] text-white flex-shrink-0 flex-col hidden md:flex border-r border-white/5 transition-all duration-300 sticky top-0 h-screen",
        isSidebarCollapsed ? "w-[72px]" : "w-64"
      )}>
        {/* Logo Section */}
        <div className="p-6 border-b border-white/5">
          <Link href={`/${site}/dashboard`} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-red rounded-lg flex items-center justify-center shadow-lg shadow-brand-red/30">
              <span className="text-white text-sm font-black">BK</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <h2 className="text-sm font-black tracking-tight uppercase leading-none text-white">
                  Berita<span className="text-brand-red">Karya</span>
                </h2>
                <p className="text-[8px] text-gray-500 uppercase tracking-[0.2em] font-bold mt-0.5">Admin Center</p>
              </div>
            )}
          </Link>
        </div>

        {/* Site Indicator */}
        <div className="mx-4 mt-4 mb-2 px-3 py-2.5 bg-white/5 rounded-lg border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-emerald-400" />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Portal Aktif</span>
            </div>
            <ChevronDown size={12} className="text-gray-500" />
          </div>
          {!isSidebarCollapsed && (
            <p className="text-xs font-black text-white uppercase tracking-tight mt-1">
              {site === 'pusat' ? 'Pusat (Nasional)' : site.charAt(0).toUpperCase() + site.slice(1)}
            </p>
          )}
        </div>
        
        {/* Navigation Sections */}
        <nav className="flex-1 px-3 pt-4 space-y-6 overflow-y-auto">
          {navSections.map((section) => {
            const filteredItems = section.items.filter(item => user && item.roles.includes(user.role))
            if (filteredItems.length === 0) return null
            return (
              <div key={section.label}>
                {!isSidebarCollapsed && (
                  <p className="px-3 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">{section.label}</p>
                )}
                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== `/${site}/dashboard` && pathname.startsWith(item.href))
                    const Icon = item.icon
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                          isActive 
                            ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30' 
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {/* Active Glow Backdrop */}
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-brand-red via-red-500 to-brand-red opacity-50 animate-pulse" />
                        )}
                        
                        <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} className="relative z-10" />
                        {!isSidebarCollapsed && (
                          <>
                            <span className="text-[11px] font-black uppercase tracking-wider relative z-10">{item.name}</span>
                            {isActive && <ChevronRight size={12} className="ml-auto opacity-60 relative z-10" />}
                          </>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-5 px-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red to-red-900 flex items-center justify-center text-xs font-black text-white shadow-lg flex-shrink-0">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black truncate text-white leading-tight tracking-tight">{user?.name}</span>
                <span className="text-[8px] text-brand-red font-black uppercase tracking-[0.2em] mt-1">
                  {ROLE_LABELS[user?.role || ''] || user?.role}
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white hover:bg-red-600 transition-all rounded-xl border border-white/5 hover:border-red-500 shadow-sm"
          >
            <LogOut size={14} />
            {!isSidebarCollapsed && 'Keluar Sistem'}
          </button>
        </div>
      </aside>

      {/* Mobile Navbar */}
      <div className="md:hidden bg-slate-900 dark:bg-[#050a15] text-white p-4 flex justify-between items-center sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-red rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-black">BK</span>
            </div>
            <h2 className="text-sm font-black uppercase tracking-tight">Admin</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-white transition-colors">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link href={`/${site}`} target="_blank" className="p-2 text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors">
            <ExternalLink size={18} />
          </Link>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900 dark:bg-[#0a0f1a] pt-20 px-4 overflow-y-auto">
          {navSections.map((section) => {
            const filteredItems = section.items.filter(item => user && item.roles.includes(user.role))
            if (filteredItems.length === 0) return null
            return (
              <div key={section.label} className="mb-6">
                <p className="px-3 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">{section.label}</p>
                {filteredItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== `/${site}/dashboard` && pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 py-3.5 px-3 rounded-lg mb-0.5",
                        isActive ? "text-brand-red bg-brand-red/5" : "text-gray-400"
                      )}
                    >
                      <Icon size={20} />
                      <span className="text-sm font-bold uppercase tracking-widest">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
          <div className="border-t border-white/5 pt-4 mt-4">
            <button onClick={logout} className="flex items-center gap-4 py-3 px-3 text-red-400 w-full">
              <LogOut size={20} />
              <span className="text-sm font-bold uppercase tracking-widest">Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white dark:bg-slate-900/50 border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-6 flex-shrink-0 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400"
            >
              <Menu size={18} />
            </button>
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input 
                type="text" 
                placeholder="Cari di dashboard..."
                className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-red/20 rounded-lg text-xs w-64 outline-none transition-all text-brand-black dark:text-white placeholder:text-gray-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="hidden md:flex p-2 text-gray-400 hover:text-brand-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <NotificationBell />
            <div className="w-px h-6 bg-gray-100 dark:bg-white/5 mx-1 hidden md:block" />
            <Link 
              href={`/${site}`} 
              target="_blank" 
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all text-gray-400 hover:text-brand-red"
            >
              <ExternalLink size={12} /> <span className="hidden sm:inline">Portal</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
