'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { register, isLoading, error, clearError, user } = useAuthStore();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Get the site ID from cookies or default to 'pusat'
      const siteId = document.cookie
        .split('; ')
        .find(row => row.startsWith('siteId='))
        ?.split('=')[1] || 'pusat';
      
      // Since they are newly registered, they have role 'reader'.
      // If we redirect them to dashboard, the layout will bounce them to '/'.
      // So let's directly push them to the portal homepage based on their siteId.
      router.push(`/${siteId}`);
    }
  }, [user, router]);

  // Clear error on unmount or when user starts typing
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    
    if (password !== confirmPassword) {
      setLocalError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      await register(name, email, password);
      // Let the useEffect handle the redirect once user is set
    } catch (err) {
      // Error is handled by the store
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f1a] flex flex-col justify-center items-center p-4">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-brand-red/5 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-in my-8">
        {/* Logo Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block group">
            <h1 className="font-serif text-4xl md:text-5xl font-black tracking-[-0.04em] leading-none text-brand-black dark:text-white">
              <span className="text-brand-red group-hover:text-brand-red/90 transition-colors">BERITA</span>
              <span className="group-hover:opacity-90 transition-opacity">KARYA</span>
            </h1>
          </Link>
        </div>

        {/* Register Box */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-8 sm:p-10 shadow-2xl shadow-black/5 rounded-sm">
          <h2 className="text-xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">Buat Akun Baru</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-8">Daftar untuk mengakses portal penuh</p>

          {displayError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-start gap-3 rounded-sm">
              <AlertCircle size={16} className="text-brand-red shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-brand-red tracking-tight">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (displayError) { clearError(); setLocalError(null); }
                }}
                required
                placeholder="Nama Anda"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (displayError) { clearError(); setLocalError(null); }
                }}
                required
                placeholder="nama@beritakarya.co"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (displayError) { clearError(); setLocalError(null); }
                  }}
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (displayError) { clearError(); setLocalError(null); }
                  }}
                  required
                  placeholder="Ulangi kata sandi"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black dark:hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !name || !email || !password || !confirmPassword}
              className="w-full flex justify-center items-center gap-2 py-4 bg-brand-red text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-black transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-sm group shadow-lg shadow-brand-red/20"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-gray-100 dark:border-slate-800 pt-6">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-brand-red hover:text-brand-black dark:hover:text-white transition-colors">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8">
          &copy; {new Date().getFullYear()} BeritaKarya Nusantara
        </p>
      </div>
    </div>
  );
}
