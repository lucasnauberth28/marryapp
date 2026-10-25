// src/app/(admin)/layout.tsx
import "./painel.css";
import { BarraLateral } from "@/components/admin/sidebar";
import { Cabecalho } from "@/components/admin/header";
import { BarraDeAbasMovel } from "@/components/admin/mobile-tab-bar";
import { obterSessao, redirecionarParaOLogin } from "@/lib/security/auth-guard";
import { NotaDoCasamentoPrincipal } from "@/components/admin/main-wedding-note";
import { FaixaDeManutencao } from "@/components/admin/maintenance-banner";
import { chavePublicaVapid } from "@/lib/notifications/push";
import { FaixaDePersonificacao } from "@/components/admin/impersonation-banner";
import { AssistenteLiz } from "@/components/liz/liz-assistant";
import { ProvedorDoTourDoPainel } from "@/components/tour/panel-tour-provider";
import { AbasDeArea } from "@/components/admin/area-tabs";
import { carregarDadosDoLayout } from "./dados-do-layout";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Perfil e permissões vêm do banco (não só do JWT), refletindo alterações de acesso na hora.
  const session = await obterSessao();
  if (!session) return redirecionarParaOLogin();

  const { role, allowedPaths } = session;
  const { wedding, account, ctx, unreadNotifications, counts, tour, subtitle, planName, siteHref } = await carregarDadosDoLayout(session);
  // "Entrar como este casal": faixa fixa no topo de TODAS as telas do painel; a barra lateral e o cabeçalho descem a altura dela
  const impersonation = ctx?.impersonation ?? null;

  return (
    <ProvedorDoTourDoPainel config={tour}>
      {impersonation && <FaixaDePersonificacao coupleNames={impersonation.weddingNames} canEdit={impersonation.canEdit} expiresAt={impersonation.expiresAt.toISOString()} />}
      {/* --faixa: altura da faixa "Vocês estão vendo como..." (0 sem ela); a barra lateral e o cabeçalho descem por ela */}
      <div className={`painel-raiz flex min-h-screen bg-linho ${impersonation ? "[--faixa:68px] md:[--faixa:56px]" : "[--faixa:0px]"}`}>
        <BarraLateral allowedPaths={allowedPaths} counts={counts} planName={planName} siteHref={siteHref} />
        {/* A folha: caixa clara com o cabeçalho e o conteúdo (no celular ocupa a tela toda) */}
        <div className="relative flex min-w-0 flex-1 flex-col bg-papel md:m-2 md:ml-0 md:rounded-2xl md:border md:border-linha">
          <Cabecalho
            role={role}
            allowedPaths={allowedPaths}
            coupleNames={wedding.coupleNames}
            initials={wedding.initials}
            subtitle={subtitle}
            adminView={account.adminView}
            userName={account.userName}
            planName={planName}
            unreadNotifications={unreadNotifications}
            pushPublicKey={chavePublicaVapid()}
          />
          <main id="conteudo" className="page-in flex-1 px-4 pb-32 pt-6 md:px-8 md:pb-24 md:pt-7">
            <div className="mx-auto w-full max-w-[1240px]">
              <FaixaDeManutencao allowedPaths={allowedPaths} />
              {account.adminView && ctx && <NotaDoCasamentoPrincipal coupleNames={wedding.coupleNames} />}
              <AbasDeArea allowedPaths={allowedPaths} counts={counts} />
              {children}
            </div>
          </main>
        </div>
        <BarraDeAbasMovel allowedPaths={allowedPaths} />
        <AssistenteLiz allowedPaths={allowedPaths} />
      </div>
    </ProvedorDoTourDoPainel>
  );
}
