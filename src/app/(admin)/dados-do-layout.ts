import type { ContextoDeAutenticacaoSegura } from "@/lib/security/auth-guard";
import { obterVisaoDaConta, obterIdentidadeDoCasamentoPrincipal } from "@/lib/casamento/wedding";
import { obterContextoDoCasamento } from "@/lib/security/wedding-context";
import { obterContagensDoMenu } from "@/lib/painel/nav-counts";
import { diasAte, rotuloDosDiasRestantes } from "@/lib/casamento/wedding-format";
import { quantidadeNaoLidaDe } from "@/lib/notifications/queries";
import { carregarTourDoPainel } from "@/lib/tour/panel-tour";
import { obterPlanoDoCasamento } from "@/lib/casamento/wedding-plan";
import { nomeCurtoDoPlano } from "@/lib/painel/panel-nav";
import { urlDoSiteDoCasamento } from "@/lib/casamento/wedding-links";

/** Tudo o que o cabeçalho, a barra lateral e o passo a passo do painel precisam saber do casamento e da pessoa. */
export async function carregarDadosDoLayout(session: ContextoDeAutenticacaoSegura) {
  const [wedding, account, ctx, unreadNotifications] = await Promise.all([
    obterIdentidadeDoCasamentoPrincipal(),
    obterVisaoDaConta(),
    obterContextoDoCasamento(),
    quantidadeNaoLidaDe(session.userId),
  ]);
  const [counts, tour, plan] = await Promise.all([
    ctx ? obterContagensDoMenu(ctx.weddingId, session.allowedPaths.includes("*")) : undefined,
    carregarTourDoPainel(session, ctx), // passo a passo do painel (null para administração, visita "Entrar como" e fornecedor)
    ctx && !account.adminView ? obterPlanoDoCasamento(ctx.weddingId) : null,
  ]);
  // Cabeçalho: "17 abr 2027 · faltam 191 dias" (casal); a administração não mostra data
  const daysLeft = rotuloDosDiasRestantes(wedding.weddingDate ? diasAte(wedding.weddingDate) : null);
  return {
    wedding, account, ctx, unreadNotifications, counts, tour,
    subtitle: account.adminView ? null : [wedding.shortDateLabel, daysLeft].filter(Boolean).join(" · ") || null,
    planName: plan ? nomeCurtoDoPlano(plan.planId) : null,
    siteHref: !account.adminView && ctx && wedding.slug ? urlDoSiteDoCasamento(wedding.slug, undefined, ctx.wedding.customDomain) : null,
  };
}
