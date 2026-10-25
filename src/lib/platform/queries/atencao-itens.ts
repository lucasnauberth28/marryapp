// Visão geral: o que precisa da atenção da equipe. Cada item só aparece se existir (lista vazia = "Tudo em dia").
import { diaRelativo, haQuantoTempo, diasEntre } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReais } from "@/lib/formatacao/dinheiro";

export interface EntradaDeAtencao {
  id: string;
  tone: "aviso" | "perigo" | "neutro";
  icon: "clock" | "alert" | "shield" | "globe" | "activity" | "life" | "wallet" | "message";
  title: string;
  detail: string;
  actionLabel: string;
  href: string;
}

export const ROTULO_DO_SERVICO: Record<string, string> = {
  mercadopago: "Mercado Pago",
  whatsapp: "WhatsApp",
  email: "E-mail",
  push: "Notificações no celular",
};


export interface DadosDeAtencao {
  pix: { count: number; totalCents: number; oldestAt: Date | null };
  refunds: { count: number; totalCents: number; nextDueAt: Date | null };
  curation: { count: number; oldestAt: Date | null };
  domains: { domain: string; requestedAt: Date; wedding: { coupleNames: string } }[];
  dataRequests: { dueAt: Date }[];
  tickets: number;
  serviceFailures: { service: string; _count: { _all: number } }[];
  suspended: { id: string; coupleNames: string; weddingDate: Date | null }[];
}

const aviso = (id: string, icon: EntradaDeAtencao["icon"], title: string, detail: string, actionLabel: string, href: string): EntradaDeAtencao => ({ id, tone: "aviso", icon, title, detail, actionLabel, href });

type Itens = EntradaDeAtencao[];

function itensDoPix({ pix }: DadosDeAtencao, now: Date): Itens {
  if (pix.count === 0) return [];
  const mais = pix.oldestAt ? `, o mais antigo gerado ${haQuantoTempo(pix.oldestAt, now)}` : "";
  return [aviso("pix", "clock", `Conferir ${pluralizar(pix.count, "Pix de plano", "Pix de plano")}`, `${formatarReais(pix.totalCents)} no total${mais}.`, "Conferir", "/admin/planos/assinaturas")];
}

function itensDosSuspensos({ suspended }: DadosDeAtencao, now: Date): Itens {
  return suspended.map((w) => {
    const dataPerto = w.weddingDate && diasEntre(w.weddingDate, now) >= 0 && diasEntre(w.weddingDate, now) <= 30;
    return {
      id: `suspenso-${w.id}`,
      tone: "perigo",
      icon: "alert",
      title: `Casamento suspenso${dataPerto && w.weddingDate ? ` e a data é ${diaRelativo(w.weddingDate, now)}` : ""}`,
      detail: `${w.coupleNames}. O site está fora do ar e o painel só lê.`,
      actionLabel: "Abrir casal",
      href: `/admin/casais/${w.id}`,
    };
  });
}

function itensDaCuradoria({ curation }: DadosDeAtencao, now: Date): Itens {
  if (curation.count === 0) return [];
  const detail = curation.oldestAt ? `O mais antigo chegou ${haQuantoTempo(curation.oldestAt, now)}.` : "Veja quem está na fila.";
  return [aviso("curadoria", "shield", `${pluralizar(curation.count, "fornecedor espera", "fornecedores esperam")} a curadoria`, detail, "Analisar", "/admin/fornecedores/curadoria")];
}

function itensDosDominios({ domains }: DadosDeAtencao, now: Date): Itens {
  return domains.map((d) =>
    aviso(`dominio-${d.domain}`, "globe", "Pedido novo de domínio próprio", `${d.domain} (${d.wedding.coupleNames}) espera o início do registro desde ${haQuantoTempo(d.requestedAt, now)}.`, "Começar registro", "/admin/dominios"),
  );
}

function itensDosReembolsos({ refunds }: DadosDeAtencao, now: Date): Itens {
  if (refunds.count === 0) return [];
  const resposta = refunds.nextDueAt ? `, responder ${diaRelativo(refunds.nextDueAt, now)}` : "";
  return [aviso("reembolso", "wallet", pluralizar(refunds.count, "reembolso para decidir", "reembolsos para decidir"), `${formatarReais(refunds.totalCents)} no total${resposta}.`, "Decidir", "/admin/planos?aba=reembolsos")];
}

function itensDosPedidosDeDados({ dataRequests }: DadosDeAtencao, now: Date): Itens {
  if (dataRequests.length === 0) return [];
  const first = dataRequests[0].dueAt;
  const left = diasEntre(first, now);
  return [
    {
      id: "lgpd",
      tone: left < 0 ? "perigo" : "aviso",
      icon: "life",
      title: left < 0 ? "Pedido sobre dados pessoais com o prazo vencido" : `Pedido sobre dados pessoais vence ${diaRelativo(first, now)}`,
      detail: `${pluralizar(dataRequests.length, "pedido aberto perto do prazo", "pedidos abertos perto do prazo")}. Confirme o prazo com o jurídico.`,
      actionLabel: "Abrir pedido",
      href: "/admin/suporte",
    },
  ];
}

function itensDosChamados({ tickets }: DadosDeAtencao): Itens {
  if (tickets === 0) return [];
  return [aviso("chamados", "message", pluralizar(tickets, "chamado novo", "chamados novos"), "Pedidos de ajuda que a equipe registrou e ainda não começou.", "Ver chamados", "/admin/suporte")];
}

function itensDasFalhas({ serviceFailures }: DadosDeAtencao): Itens {
  return serviceFailures.map((f) =>
    aviso(`falha-${f.service}`, "activity", `${ROTULO_DO_SERVICO[f.service] ?? f.service} falhou ${pluralizar(f._count._all, "vez", "vezes")}`, "Nas últimas 24 horas. Confira o que não foi concluído.", "Ver detalhes", "/admin/saude"),
  );
}

/** Os itens na ordem em que aparecem na tela: Pix, casamentos suspensos, curadoria, domínios, reembolsos, dados pessoais, chamados e falhas. */
export function montarItensDeAtencao(dados: DadosDeAtencao, now: Date): EntradaDeAtencao[] {
  return [
    ...itensDoPix(dados, now),
    ...itensDosSuspensos(dados, now),
    ...itensDaCuradoria(dados, now),
    ...itensDosDominios(dados, now),
    ...itensDosReembolsos(dados, now),
    ...itensDosPedidosDeDados(dados, now),
    ...itensDosChamados(dados),
    ...itensDasFalhas(dados),
  ];
}
