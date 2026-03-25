import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. Atualiza os cookies da sessão e obtém o usuário
  const { supabaseResponse, user } = await updateSession(request)

  // 2. Define rotas públicas/auth
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isPublicRoute = request.nextUrl.pathname.startsWith('/auth') // ex: callback hooks
  
  // Se não tem usuário e tenta acessar área restrita -> Manda pro Login
  if (!user && !isAuthRoute && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    const response = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value)
    })
    return response
  }

  // Se já tem usuário e tenta acessar a tela de login -> Manda pro Dashboard
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    const response = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value)
    })
    return response
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
