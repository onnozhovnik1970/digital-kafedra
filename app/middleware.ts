import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Пропускаємо auth сторінки
  if (pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  // Перевіряємо наявність сесії через cookies
  const token = request.cookies.get('sb-access-token') || 
                request.cookies.getAll().find(c => c.name.includes('auth-token'))

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth).*)'],
}