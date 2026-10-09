import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, hasPathAccess, SESSION_COOKIE_NAME } from "@/lib/auth";

// Rotas acessíveis sem login. Tudo que não estiver aqui exige sessão (deny-by-default).
// Isto é apenas uma checagem otimista de navegação: cada Server Action e Route Handler
// valida a sessão e as permissões novamente no servidor.
const PUBLIC_PATHS = [
  "/login",
  "/cadastro",
  "/assinar",
  "/casamento",
  "/fornecedores",
  "/monte-seu-plano",
  "/presentes",
  "/checkout",
  "/rsvp",
  "/dia-do-evento",
  "/api/webhooks",
  "/api/cron", // autenticada pelo CRON_SECRET na própria rota
  "/convite", // aceitar o convite do par
  "/esqueci-a-senha",
  "/redefinir-senha",
  "/termos",
  "/privacidade",
  "/proposta", // casal aceita a proposta do fornecedor pelo link
  "/avaliar", // casal avalia o fornecedor pelo link do pedido fechado
];

// Rotas de qualquer conta logada, sem depender de módulo do perfil:
// o onboarding do casamento e a área "Minha conta" (senha, convite, dados, excluir conta).
const SESSION_PATHS = ["/boas-vindas", "/conta"];

function isSessionPath(path: string) {
  return SESSION_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

function isPublicPath(path: string) {
  if (path === "/") return true;
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

function firstAllowedDestination(allowedPaths: string[]) {
  if (allowedPaths.includes("*") || allowedPaths.includes("/dashboard")) return "/dashboard";
  return allowedPaths[0] ?? "/login";
}

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = isPublicPath(path);
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!isPublic && !sessionCookie) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie) {
    const payload = await verifyToken(sessionCookie.value);

    if (!payload) {
      // Token inválido: limpa o cookie. Em rotas públicas apenas segue sem sessão.
      const response = isPublic
        ? NextResponse.next()
        : path.startsWith("/api/")
          ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
          : NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    const dest = firstAllowedDestination(payload.allowedPaths);

    if (path === "/login") {
      // Perfil sem nenhum módulo liberado permanece no login (evita loop de redirecionamento)
      return dest === "/login" ? NextResponse.next() : NextResponse.redirect(new URL(dest, request.url));
    }

    if (!isPublic && !isSessionPath(path) && !path.startsWith("/api/") && !hasPathAccess(payload.allowedPaths, path)) {
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Ignora assets do Next e arquivos estáticos (qualquer path com extensão, ex.: /logo.png)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
