import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // 1. Redirigir si ya está logueado e intenta ir a auth
  if (session && (pathname === '/login' || pathname === '/signup')) {
    console.log(`[Middleware] Usuario logueado en página de auth (${pathname}). Verificando rol...`);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = profile?.role || 'business';
    const url = request.nextUrl.clone();

    if (role === 'super_admin') url.pathname = '/super-admin';
    else if (role === 'support') url.pathname = '/support';
    else url.pathname = '/admin';

    console.log(`[Middleware] Redirigiendo a ${url.pathname} según rol: ${role}`);
    return NextResponse.redirect(url);
  }

  // 2. Proteger rutas por rol
  if (pathname.startsWith('/admin') || pathname.startsWith('/super-admin') || pathname.startsWith('/support')) {
    if (!session) {
      console.log(`[Middleware] Intento de acceso a ruta protegida sin sesión: ${pathname}`);
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Obtener rol del perfil (usamos cache de la sesión si es posible o fetch directo)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = profile?.role || 'business';

    // Restricciones de Super Admin
    if (pathname.startsWith('/super-admin') && role !== 'super_admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin'; // O una página de "no autorizado"
      return NextResponse.redirect(url);
    }

    // Restricciones de Soporte
    if (pathname.startsWith('/support') && role !== 'support' && role !== 'super_admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }

    // El admin común (Business) no debería entrar a super-admin ni support
    // (Ya cubierto por los checks de arriba, pero por claridad)
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/super-admin/:path*', '/support/:path*', '/login', '/signup'],
};
