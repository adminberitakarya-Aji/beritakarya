'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Boundary caught:', error)
  }, [error])

  const isNetworkError = error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network');

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              {isNetworkError ? 'Koneksi Gagal' : 'Terjadi Kesalahan Server'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {isNetworkError 
                ? 'Tidak dapat terhubung ke server. Pastikan koneksi internet Anda stabil atau coba lagi nanti.'
                : 'Mohon maaf, terjadi kesalahan pada sistem kami. Tim teknis telah diberi tahu.'}
            </p>
            <button
              onClick={() => reset()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            >
              Coba Lagi
            </button>
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded text-left overflow-auto max-h-40">
                <p className="text-xs text-gray-800 dark:text-gray-200 font-mono">{error.message}</p>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
