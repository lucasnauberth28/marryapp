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
import { classifyPath, isPlatformAdminPath, isSessionPath } from "@/lib/route-access";
import { isPlatformAdminPaths } from "@/lib/permissions";
import { firstAllowedDestination, loginUrl, resolvePostLoginPath } from "@/lib/login-redirect";
import { classifyHost, createTtlCache, mainRedirectUrl, routeCustomDomainPath } from "@/lib/custom-domain-host";
import prisma from "@/lib/prisma";

// As listas de rotas (públicas, de qualquer conta logada e do painel) ficam em src/lib/route-access.ts.
// Rota protegida exige sessão (deny-by-default); caminho que não pertence ao app segue direto
// e o Next responde 404, com ou sem sessão, sem revelar quais rotas protegidas existem.
// Isto é apenas uma checagem otimista de navegação: cada Server Action e Route Handler
// valida a sessão e as permissões novamente no servidor.

// ---------- Domínio próprio do casal ----------
// Visita a um endereço que não é o do app (nem localhost nem vercel.app): consulta o banco por
// Wedding.customDomain, com cache de 60 s (inclusive para "não é de ninguém"). O domínio do casal só serve as
// páginas públicas do casamento daquele slug (regras em lib/custom-domain-host.ts) e nunca recebe a sessão do painel.
const domainCache = createTtlCache<{ slug: string } | null>(60_000);

async function lookupCustomDomain(domain: string): Promise<{ slug: string } | null> {
  const cached = domainCache.get(domain);
  if (cached !== undefined) return cached;
  const wedding = await prisma.wedding.findUnique({ where: { customDomain: domain }, select: { slug: true } });
  domainCache.set(domain, wedding);
  return wedding;
}

/** Cabeçalhos da requisição sem o cookie de sessão do painel (defesa: o domínio do casal nunca autentica). */
function withoutSession(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  const cookies = (headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (cookies.length > 0) headers.set("cookie", cookies.join("; "));
  else headers.delete("cookie");
  return headers;
}

async function handleCustomDomain(request: NextRequest, domain: string): Promise<NextResponse | null> {
  let wedding: { slug: string } | null;
  try {
    wedding = await lookupCustomDomain(domain);
  } catch (error) {
    console.error("[proxy] Falha ao consultar o domínio próprio:", error instanceof Error ? error.message : error);
    return new NextResponse("Não foi possível abrir o site agora. Tente de novo em instantes.", { status: 503, headers: { "cache-control": "no-store" } });
  }
  // Endereço que não é de nenhum casal: segue como o app (a Vercel só entrega endereços adicionados ao projeto)
  if (!wedding) return null;

  const headers = withoutSession(request);
  const route = routeCustomDomainPath(request.nextUrl.pathname, wedding.slug);
  switch (route.action) {
    case "rewrite": {
      const url = request.nextUrl.clone();
      url.pathname = route.pathname;
      return NextResponse.rewrite(url, { request: { headers } });
    }
    case "pass":
      return NextResponse.next({ request: { headers } });
    case "redirect-main": {
      const target = mainRedirectUrl(process.env.NEXT_PUBLIC_BASE_URL, route.pathname, request.nextUrl.search);
      return target ? NextResponse.redirect(target, 307) : notFoundResponse(request);
    }
    default:
      return notFoundResponse(request);
  }
}

/** 404 com a página de "não encontrado" do app (reescreve para um caminho que não existe). */
function notFoundResponse(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/_dominio-nao-encontrado";
  url.search = "";
  return NextResponse.rewrite(url, { request: { headers: withoutSession(request) } });
}

export default async function proxy(request: NextRequest) {
  const host = classifyHost(request.headers.get("host"), process.env.NEXT_PUBLIC_BASE_URL);
  if (host.kind === "candidate") {
    const custom = await handleCustomDomain(request, host.domain);
    if (custom) return custom;
  }

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

    // /admin exige acesso total ("*"): um "/admin" solto na lista do perfil não vale
    const allowed = isPlatformAdminPath(path) ? isPlatformAdminPaths(payload.allowedPaths) : hasPathAccess(payload.allowedPaths, path);
    if (!isPublic && !isSessionPath(path) && !path.startsWith("/api/") && !allowed) {
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
