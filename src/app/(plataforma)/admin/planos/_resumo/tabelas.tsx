import { Clock, TicketPercent } from "lucide-react";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDePlano, EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import type { obterCatalogo } from "@/lib/catalog-server";
import { formatarData, formatarInteiro, diaRelativo } from "@/lib/platform/format";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { obterPlanosDeFornecedorPrestesAVencer } from "@/lib/platform/queries/fornecedores";
import type { listarCuponsEmUso } from "@/lib/platform/queries/receita";

type Vencimento = Awaited<ReturnType<typeof obterPlanosDeFornecedorPrestesAVencer>>[number];
type Cupom = Awaited<ReturnType<typeof listarCuponsEmUso>>[number];

export function PainelDeVencimentos({ expiring, catalog, now }: { expiring: Vencimento[]; catalog: Awaited<ReturnType<typeof obterCatalogo>>; now: Date }) {
  return (
    <Painel title="Vencimentos da semana" action={{ label: "Ver fornecedores", href: "/admin/fornecedores?aba=vencendo" }} padded={false}>
      <div className="px-3 pb-3 md:px-4 md:pb-4">
        <TabelaResponsiva
          caption="Planos de fornecedor que vencem nos próximos 7 dias"
          rows={expiring}
          rowKey={(v) => v.id}
          empty={<EstadoVazio icon={Clock} title="Nenhum plano vence esta semana" compact />}
          columns={[
            { key: "nome", header: "Fornecedor", primary: true, cell: (v) => v.companyName },
            { key: "plano", header: "Plano", cell: (v) => <EtiquetaDePlano plan={v.planTier} /> },
            { key: "vence", header: "Vence", cell: (v) => `${formatarData(v.planExpiresAt)} (${diaRelativo(v.planExpiresAt, now)})` },
            { key: "valor", header: "Valor", align: "right", cell: (v) => formatarReais(catalog.plans[v.planTier === "PRO" ? "pro" : "master"].price) },
            { key: "aviso", header: "Aviso", cell: (v) => (v.reminderSent ? <EtiquetaDeSituacao tone="sucesso">Enviado</EtiquetaDeSituacao> : <EtiquetaDeSituacao tone="neutro" icon={Clock}>Pendente</EtiquetaDeSituacao>) },
          ]}
        />
      </div>
    </Painel>
  );
}

export function PainelDeCupons({ coupons }: { coupons: Cupom[] }) {
  return (
    <Painel title="Cupons em uso" action={{ label: "Gerenciar cupons", href: "/admin/planos/cupons" }} padded={false}>
      <div className="px-3 pb-3 md:px-4 md:pb-4">
        <TabelaResponsiva
          caption="Cupons valendo agora"
          rows={coupons}
          rowKey={(c) => c.id}
          empty={<EstadoVazio icon={TicketPercent} title="Nenhum cupom valendo" compact>Crie um cupom em Gerenciar cupons.</EstadoVazio>}
          columns={[
            { key: "codigo", header: "Código", primary: true, cell: (c) => <span className="font-mono">{c.code}</span> },
            { key: "desconto", header: "Desconto", cell: (c) => (c.percentOff ? `${c.percentOff}%` : c.amountOff ? formatarReais(c.amountOff) : "Sem desconto") },
            { key: "usos", header: "Usos", align: "right", cell: (c) => (c.maxRedemptions ? `${formatarInteiro(c.redemptions)} de ${formatarInteiro(c.maxRedemptions)}` : formatarInteiro(c.redemptions)) },
            { key: "ate", header: "Vale até", cell: (c) => (c.expiresAt ? formatarData(c.expiresAt) : "Sem prazo") },
          ]}
        />
      </div>
    </Painel>
  );
}
