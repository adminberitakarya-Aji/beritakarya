import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || ''
  
  // bandung.localhost:3000 -> bandung
  // bandung.beritakarya.co -> bandung
  // beritakarya.co -> '' (pusat)
  
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  
  let subdomain = ''
  if (isLocalhost) {
    // Handle bandung.localhost:3000 or localhost:3000
    const parts = hostname.split('.')
    if (parts.length > 1 && !parts[0].includes(':') && parts[0] !== 'localhost') {
      subdomain = parts[0]
    }
  } else {
    // Handle bandung.beritakarya.co or beritakarya.co
    const parts = hostname.split('.')
    if (parts.length > 2) {
      subdomain = parts[0]
    }
  }

  let siteId = subdomain
  
  if (isLocalhost) {
    // Prioritaskan ?site= parameter untuk testing manual tanpa edit hosts
    const siteParam = req.nextUrl.searchParams.get('site')
    if (siteParam) {
      siteId = siteParam
    } else if (!subdomain || subdomain === 'www') {
      siteId = 'pusat'
    }
  } else {
    // Di produksi, jika domain utama atau pakai www, arahkan ke pusat
    if (!subdomain || subdomain === 'www') {
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
  // Point '/', '/dashboard', '/sitemap.xml', '/robots.txt' ke '/[siteId]/...' secara internal
  const shouldRewrite = 
    url.pathname === '/' || 
    url.pathname.startsWith('/dashboard') || 
    url.pathname === '/sitemap.xml' || 
    url.pathname === '/robots.txt'

  if (shouldRewrite) {
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