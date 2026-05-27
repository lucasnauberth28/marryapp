import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const publicPaths = ["/login", "/presentes", "/checkout", "/api", "/rsvp"];
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath) || path === "/");
  
  const sessionCookie = request.cookies.get("marryapp_admin_session");

  if (!isPublicPath && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie) {
    const payload = await verifyToken(sessionCookie.value);
    
    if (!payload) {
      // Token inválido
      request.cookies.delete("marryapp_admin_session");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Se está no login mas já tem token, redireciona
    if (path === "/login") {
      const dest = payload.allowedPaths.includes("/dashboard") || payload.allowedPaths.includes("*") ? "/dashboard" : "/convidados";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    // Validação de acesso à rota para rotas não públicas
    if (!isPublicPath) {
      const isAllowed = payload.allowedPaths.includes("*") || 
        payload.allowedPaths.some((p: string) => path.startsWith(p));
      
      if (!isAllowed) {
        // Fallback de segurança se tentar acessar rota proibida
        const dest = payload.allowedPaths[0] && payload.allowedPaths[0] !== "*" ? payload.allowedPaths[0] : "/login";
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Aplica o middleware a todas as rotas exceto arquivos estáticos do Next.js
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
