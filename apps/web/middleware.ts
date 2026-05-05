import { NextResponse } from 'next'
import type { NextRequest } from 'next'

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || ''
  
  // Deteksi subdomain
  // bandung.localhost:3000 -> bandung
  // bandung.beritakarya.com -> bandung
  // beritakarya.co -> beritakarya (default ke pusat nanti)
  const parts = hostname.split('.')
  let subdomain = parts.length > 1 ? parts[0] : ''

  const isLocalhost = hostname.includes('localhost')
  
  let siteId = subdomain
  
  if (isLocalhost) {
    // Di localhost, prioritaskan ?site= parameter untuk testing
    siteId = req.nextUrl.searchParams.get('site') || subdomain
    if (!siteId || siteId === 'localhost' || siteId === '3000') {
      siteId = 'pusat'
    }
  } else {
    // Di produksi, jika domain utama atau pakai www, arahkan ke pusat
    if (!subdomain || subdomain === 'www' || subdomain === 'beritakarya') {
      siteId = 'pusat'
    }
  }

  const res = NextResponse.next()
  res.cookies.set('siteId', siteId, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24
  })
  res.headers.set('x-site-id', siteId)

  const url = req.nextUrl.clone()
  
  // Internal Rewrite: 
  // Point '/' atau '/dashboard' ke '/[siteId]/...' secara internal
  if (url.pathname === '/' || url.pathname.startsWith('/dashboard')) {
    url.pathname = `/${siteId}${url.pathname === '/' ? '' : url.pathname}`
    const rewriteRes = NextResponse.rewrite(url)
    
    rewriteRes.cookies.set('siteId', siteId, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    })
    rewriteRes.headers.set('x-site-id', siteId)
    
    return rewriteRes
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
}