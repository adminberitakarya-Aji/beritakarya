import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { KNOWN_SITE_IDS } from '@beritakarya/config'

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]

  const isLocalhost = hostname.includes('localhost')
  let siteId = isLocalhost
    ? req.nextUrl.searchParams.get('site') || subdomain
    : subdomain

  // If on localhost and siteId is not recognized (like 'localhost' itself), 
  // default to 'pusat' for development convenience.
  if (isLocalhost && !KNOWN_SITE_IDS.includes(siteId)) {
    siteId = 'pusat'
  }

  if (!KNOWN_SITE_IDS.includes(siteId) && !hostname.includes('www') && !isLocalhost) {
    return NextResponse.rewrite(new URL('/404', req.url))
  }

  const res = NextResponse.next()
  res.cookies.set('siteId', siteId, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24
  })
  res.headers.set('x-site-id', siteId)

  // Internal Rewrite: 
  // If the user accesses '/' or '/dashboard' (and its subroutes), 
  // we internally point them to '/[siteId]/...' 
  // without changing the URL in the browser address bar.
  const url = req.nextUrl.clone()
  if (url.pathname === '/' || url.pathname.startsWith('/dashboard')) {
    url.pathname = `/${siteId}${url.pathname === '/' ? '' : url.pathname}`
    const rewriteRes = NextResponse.rewrite(url)
    // IMPORTANT: Set cookie on the rewrite response too!
    rewriteRes.cookies.set('siteId', siteId, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    })
    return rewriteRes
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
}