import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || 
                     req.nextUrl.pathname.startsWith('/signup')
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
                           req.nextUrl.pathname.startsWith('/audit') ||
                           req.nextUrl.pathname.startsWith('/portfolio') ||
                           req.nextUrl.pathname.startsWith('/board') ||
                           req.nextUrl.pathname.startsWith('/history') ||
                           req.nextUrl.pathname.startsWith('/settings')

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/audit/:path*',
    '/portfolio/:path*',
    '/board/:path*',
    '/history/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
  ],
}
