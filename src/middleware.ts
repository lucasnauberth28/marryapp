import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Pega o path atual
  const path = request.nextUrl.pathname;

  // Verifica se é uma rota protegida. Tudo que seria do admin (ex: dashboard, convidados, etc).
  // No seu projeto, as rotas do admin estão espalhadas (ex: /dashboard, /convidados).
  // Vamos definir um array de rotas protegidas ou checar se não é uma rota pública.
  
  // Rotas públicas conhecidas
  const publicPaths = ["/login", "/presentes", "/checkout", "/api", "/rsvp"];
  
  // Verifica se o path começa com algum dos publicPaths
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath) || path === "/");
  
  // O cookie que definimos
  const sessionCookie = request.cookies.get("marryapp_admin_session");

  // Se não é uma rota pública e não tem cookie, redireciona para login
  if (!isPublicPath && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Se o usuário está logado e tenta ir pro login, manda pro dashboard
  if (path === "/login" && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Aplica o middleware a todas as rotas exceto arquivos estáticos do Next.js
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
