import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifyToken,
  hasPathAccess,
  SESSION_COOKIE_NAME,
  SESSION_SEEN_COOKIE_NAME,
  sessionSeenCookieOptions,
  CURRENT_PATH_HEADER,
} from "@/lib/auth";
import { classifyPath, isSessionPath } from "@/lib/route-access";
import { loginUrl, resolvePostLoginPath } from "@/lib/login-redirect";

// As listas de rotas (públicas, de qualquer conta logada e do painel) ficam em src/lib/route-access.ts.
// Rota protegida exige sessão (deny-by-default); caminho que não pertence ao app segue direto
// e o Next responde 404, com ou sem sessão, sem revelar quais rotas protegidas existem.
// Isto é apenas uma checagem otimista de navegação: cada Server Action e Route Handler
// valida a sessão e as permissões novamente no servidor.

function firstAllowedDestination(allowedPaths: string[]) {
  if (allowedPaths.includes("*") || allowedPaths.includes("/dashboard")) return "/dashboard";
  return allowedPaths[0] ?? "/login";
}

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const kind = classifyPath(path);

  // Não é rota do app: o Next responde 404 (nada de mandar visitante para o login)
  if (kind === "unknown") return NextResponse.next();

  const isPublic = kind === "public";
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const seenBefore = request.cookies.has(SESSION_SEEN_COOKIE_NAME);

  // Caminho que a pessoa abriu (com a busca), para voltar a ele depois do login
  const here = `${path}${request.nextUrl.search}`;
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set(CURRENT_PATH_HEADER, here);
  const pass = () => NextResponse.next({ request: { headers: forwardedHeaders } });

  const toLogin = (expired: boolean) => {
    const response = NextResponse.redirect(new URL(loginUrl(here, expired), request.url));
    // O aviso aparece uma vez: depois dele a marca de "já esteve logada" é apagada
    if (expired) response.cookies.delete(SESSION_SEEN_COOKIE_NAME);
    return response;
  };

  if (!isPublic && !sessionCookie) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Sem o cookie mas com a marca: a sessão venceu
    return toLogin(seenBefore);
  }

  if (sessionCookie) {
    const payload = await verifyToken(sessionCookie.value);

    if (!payload) {
      // Token inválido ou vencido: limpa o cookie. Em rotas públicas apenas segue sem sessão.
      const response = isPublic
        ? pass()
        : path.startsWith("/api/")
          ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
          : toLogin(true);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    const dest = firstAllowedDestination(payload.allowedPaths);

    if (path === "/login") {
      // ?expirou=1 vindo do servidor (a sessão é válida no token mas não existe mais): mostra o login
      // para não girar em círculos. Perfil sem nenhum módulo liberado também permanece no login.
      if (request.nextUrl.searchParams.get("expirou") === "1" || dest === "/login") return pass();
      const target = resolvePostLoginPath(request.nextUrl.searchParams.get("proxima"), dest, payload.allowedPaths);
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (!isPublic && !isSessionPath(path) && !path.startsWith("/api/") && !hasPathAccess(payload.allowedPaths, path)) {
      return NextResponse.redirect(new URL(dest, request.url));
    }

    const response = pass();
    if (!seenBefore) response.cookies.set(SESSION_SEEN_COOKIE_NAME, "1", sessionSeenCookieOptions());
    return response;
  }

  return pass();
}

export const config = {
  // Ignora assets do Next e arquivos estáticos (qualquer path com extensão, ex.: /logo.png)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
