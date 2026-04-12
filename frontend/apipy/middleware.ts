import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Ne pas interferer avec les ressources statiques
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Le middleware NextJS côté server ne peut pas accéder aux données client
  // La protection des routes se fait côté client dans les layouts
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
