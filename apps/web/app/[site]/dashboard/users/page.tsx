'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'wapimred' | 'journalist' | 'reader';
  siteId?: string | null;
  createdAt: string;
}

export default function UsersDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [siteId, setSiteId] = useState<string>('pusat');
  const router = useRouter();

  // Get site from URL
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^[^/]+/);
    if (match) {
      setSiteId(match[0].slice(1));
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (showAll) {
        params.append('site', 'all');
      }
      const response = await fetch(`/api/v1/users?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [showAll]);

  const getRoleBadge = (role: string) => {
    const styles = {
      superadmin: 'bg-red-100 text-red-800 border-red-300',
      wapimred: 'bg-blue-100 text-blue-800 border-blue-300',
      journalist: 'bg-green-100 text-green-800 border-green-300',
      reader: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return styles[role as keyof typeof styles] || styles.reader;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      superadmin: 'Superadmin',
      wapimred: 'Wapimred',
      journalist: 'Wartawan',
      reader: 'Pembaca'
    };
    return labels[role as keyof typeof labels] || role;
  };

  // Filter users based on role and current site
  const getVisibleUsers = () => {
    if (showAll) return users;
    // Non-superadmin only see users from their own site
    return users.filter(u => u.siteId === siteId || u.role === 'superadmin');
  };

  const visibleUsers = getVisibleUsers();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manajemen Pengguna
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Kelola akun wartawan dan tim redaksi
            {!showAll && <span className="text-red-600 font-semibold"> di {siteId}</span>}
          </p>
        </div>

        {/* Superadmin Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              showAll 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {showAll ? '🌐 Semua Situs' : '📍 Situs Ini'}
          </button>
          
          {showAll && (
            <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-900/30">
              Melihat semua pengguna di semua situs. Hanya superadmin.
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Total Users</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{visibleUsers.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Superadmin</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {visibleUsers.filter(u => u.role === 'superadmin').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Wapimred</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {visibleUsers.filter(u => u.role === 'wapimred').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Wartawan</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {visibleUsers.filter(u => u.role === 'journalist').length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Nama
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Peran
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Situs
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Bergabung
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : visibleUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <span className="text-4xl">👥</span>
                    <span className="text-sm font-bold uppercase tracking-widest">Belum ada pengguna</span>
                    <p className="text-xs">Pengguna akan muncul setelah mereka register atau di-invite.</p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red to-red-900 flex items-center justify-center text-white text-sm font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a href={`mailto:${user.email}`} className="text-sm text-blue-600 hover:underline">
                      {user.email}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadge(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.siteId ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        {user.siteId}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300">
                        Global
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Menampilkan {visibleUsers.length} dari {users.length} pengguna
            {showAll && <span className="text-purple-600 dark:text-purple-400"> (semua situs)</span>}
          </p>
        </div>
      </div>
    </div>
  );
}