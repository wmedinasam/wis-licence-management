import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas (no requieren autenticación)
  const publicRoutes = ['/login', '/api/admin/auth/login', '/api/licenses/verify'];
  
  // Si es ruta pública, permitir acceso
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Si intenta acceder a rutas admin sin autenticación
  if (pathname.startsWith('/admin')) {
    const cookie = request.cookies.get('admin_session');
    
    if (!cookie || cookie.value !== 'authenticated') {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
