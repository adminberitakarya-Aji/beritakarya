'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../store/authStore';
import { Loader2, Shield, User as UserIcon, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { user: currentUser } = useAuthStore();
  const { site } = useParams() as { site: string };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/users', { params: { site } });
      setUsers(data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Gagal mengambil data pengguna');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      // Refresh the list to reflect changes
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Gagal mengubah role');
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-[9px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 w-max"><Shield size={10} /> Superadmin</span>;
      case 'pimred':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 text-[9px] font-bold uppercase tracking-wider rounded-sm w-max">Pimred</span>;
      case 'journalist':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-[9px] font-bold uppercase tracking-wider rounded-sm w-max">Jurnalis</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 text-[9px] font-bold uppercase tracking-wider rounded-sm w-max">Pembaca</span>;
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-red" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-serif font-black tracking-tight mb-2">Tim Redaksi & Pengguna</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola peran (role) dari setiap akun yang terdaftar di sistem.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-brand-red text-sm font-bold rounded-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-black/20 text-[10px] uppercase font-bold tracking-widest text-gray-500 border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-4">Nama & Email</th>
                <th className="px-6 py-4">Role Saat Ini</th>
                <th className="px-6 py-4">Bergabung Sejak</th>
                <th className="px-6 py-4 text-right">Aksi (Ubah Role)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center font-serif font-bold italic shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-black dark:text-white">{u.name}</span>
                        <span className="text-[11px] text-gray-500">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id === currentUser?.id ? (
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Akun Anda</span>
                    ) : (
                      <div className="flex justify-end items-center gap-2">
                        {updatingId === u.id && <Loader2 size={14} className="animate-spin text-brand-red" />}
                        <select
                          className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs text-brand-black dark:text-white rounded-sm px-2 py-1.5 focus:outline-none focus:border-brand-red cursor-pointer disabled:opacity-50"
                          value={u.role}
                          disabled={updatingId === u.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="reader">Pembaca Biasa</option>
                          <option value="journalist">Jurnalis</option>
                          <option value="pimred">Pimred</option>
                          {currentUser?.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
                        </select>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <UserIcon size={32} className="mx-auto mb-3 opacity-20" />
                    Belum ada data pengguna.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
