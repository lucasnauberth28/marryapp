"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { urlBaseDoApp } from "@/lib/app-url";
import { registrarAuditoria } from "@/lib/audit";
import { ehViolacaoDeUnicidade } from "@/lib/prisma-erros";
import { ehDominioReservado } from "@/lib/custom-domain-host";
import { esconderDocumento } from "@/lib/document-br";
import { verificarDisponibilidadeDoDominio, type DisponibilidadeDoDominio } from "@/lib/domain-availability";
import { normalizarNomeDeDominio } from "@/lib/domain-name";
import { SITUACOES_ATIVAS, interpretarPedidoDeDominio, type CampoDoPedidoDeDominio } from "@/lib/domain-order";
import { VERSAO_DOS_TERMOS_DE_DOMINIO } from "@/lib/domain-terms";
import { ErroDeAutorizacao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { conferirLimiteDeUso, obterIpDoCliente } from "@/lib/security/rate-limiter";
import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import { obterPlanoDoCasamento, recusaDeModulo } from "@/lib/wedding-plan";

// Ações do casal para o domínio próprio. Tudo é do casamento da sessão: o navegador nunca diz de qual
// casamento é o pedido. O CPF/CNPJ completo só é gravado e nunca volta para o navegador.

const ERRO_DE_SESSAO = "Entre na sua conta de novo para continuar.";
const ERRO_DE_OCUPADO = "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";

type Contexto = Awaited<ReturnType<typeof exigirCasamento>>;

/** `write: false` para consultas (só leem): valem também em "entrar como" somente leitura e casamento suspenso. */
async function obterContextoDaPessoa(write = true): Promise<{ ctx: Contexto; error?: undefined } | { ctx?: undefined; error: string }> {
  try {
    return { ctx: await (write ? exigirCasamento("/dominio") : exigirCasamentoParaLeitura("/dominio")) };
  } catch (error) {
    if (error instanceof ErroDeAutorizacao) return { error: error.message || ERRO_DE_SESSAO };
    throw error;
  }
}

async function limiteExcedido(scope: string, userId: string, limit: number, windowMs: number): Promise<boolean> {
  const ip = await obterIpDoCliente();
  const [byUser, byIp] = await Promise.all([
    conferirLimiteDeUso({ key: `${scope}:u:${userId}`, limit, windowMs }),
    conferirLimiteDeUso({ key: `${scope}:ip:${ip}`, limit: limit * 3, windowMs }),
  ]);
  return !byUser.success || !byIp.success;
}

export type ResultadoDaVerificacaoDoDominio =
  | { success: true; domain: string; availability: DisponibilidadeDoDominio }
  | { success: false; error: string };

/** Confere se o nome está livre no Registro.br. É só um aviso: a conferência final é na hora de registrar. */
export async function verificarDisponibilidadeDoDominioAcao(input: { domain: string }): Promise<ResultadoDaVerificacaoDoDominio> {
  const got = await obterContextoDaPessoa(false);
  if (got.error !== undefined) return { success: false, error: got.error };
  const { ctx } = got;

  const refusal = await recusaDeModulo(ctx, "customDomain");
  if (refusal) return { success: false, error: refusal };

  const name = normalizarNomeDeDominio(typeof input?.domain === "string" ? input.domain : "");
  if (!name.ok) return { success: false, error: name.error };
  if (ehDominioReservado(name.domain, urlBaseDoApp())) return { success: false, error: "Esse endereço não está disponível. Escolham outro nome." };

  if (await limiteExcedido("DOMAIN_CHECK", ctx.session.userId, 40, 60_000)) return { success: false, error: ERRO_DE_OCUPADO };

  const availability = await verificarDisponibilidadeDoDominio(name.domain);
  return { success: true, domain: name.domain, availability };
}

export type ResultadoDoPedidoDeDominio =
  | { success: true }
  | { success: false; error?: string; fieldErrors?: Partial<Record<CampoDoPedidoDeDominio, string>> };

/** Cria o pedido de domínio do casamento, no nome do titular informado. */
export async function pedirDominio(input: unknown): Promise<ResultadoDoPedidoDeDominio> {
  const got = await obterContextoDaPessoa();
  if (got.error !== undefined) return { success: false, error: got.error };
  const { ctx } = got;
  const { weddingId, session } = ctx;

  const refusal = await recusaDeModulo(ctx, "customDomain");
  if (refusal) return { success: false, error: refusal };

  if (await limiteExcedido("DOMAIN_REQUEST", session.userId, 6, 10 * 60_000)) return { success: false, error: ERRO_DE_OCUPADO };

  const parsed = interpretarPedidoDeDominio(input);
  if (!parsed.ok) return { success: false, fieldErrors: parsed.fieldErrors };
  const data = parsed.data;

  if (ehDominioReservado(data.domain, urlBaseDoApp())) {
    return { success: false, fieldErrors: { domain: "Esse endereço não está disponível. Escolham outro nome." } };
  }

  // Um pedido ativo por casamento e um nome por pedido ativo (o banco também garante, para corridas)
  const [mine, sameName] = await Promise.all([
    prisma.domainOrder.findFirst({ where: { weddingId, status: { in: [...SITUACOES_ATIVAS] } }, select: { id: true } }),
    prisma.domainOrder.findFirst({ where: { domain: data.domain, status: { in: [...SITUACOES_ATIVAS] } }, select: { id: true } }),
  ]);
  if (mine) return { success: false, error: "Vocês já têm um pedido de domínio em andamento." };
  if (sameName) return { success: false, fieldErrors: { domain: "Esse endereço já está em um pedido. Escolham outro nome." } };

  // Nome ocupado ou em liberação não dá para pedir. Se a consulta falhar, o pedido segue e conferimos ao registrar.
  const availability = await verificarDisponibilidadeDoDominio(data.domain);
  if (availability === "taken") return { success: false, fieldErrors: { domain: `${data.domain} já tem dono. Escolham outro nome.` } };
  if (availability === "releasing") {
    return { success: false, fieldErrors: { domain: `${data.domain} está em liberação e não dá para pedir agora. Escolham outro nome.` } };
  }

  const plan = session.userId === ID_DO_SUPER_ADMIN ? null : await obterPlanoDoCasamento(weddingId);

  let orderId: string;
  try {
    const order = await prisma.domainOrder.create({
      data: {
        weddingId,
        requestedByUserId: session.userId === ID_DO_SUPER_ADMIN ? null : session.userId,
        subscriptionId: plan?.subscriptionId ?? null,
        domain: data.domain,
        holderName: data.holderName,
        holderDocument: data.holderDocument,
        holderEmail: data.holderEmail,
        holderPhone: data.holderPhone,
      },
      select: { id: true },
    });
    orderId = order.id;
  } catch (error) {
    if (ehViolacaoDeUnicidade(error)) return { success: false, error: "Já existe um pedido para este casamento ou para este endereço. Atualize a página." };
    console.error("[requestDomainAction]", error instanceof Error ? error.message : error);
    return { success: false, error: "Não conseguimos registrar o pedido agora. Tente de novo em instantes." };
  }

  // Sem CPF/CNPJ nem contato do titular no registro de atividades
  await registrarAuditoria({
    action: "domain.request",
    targetType: "DomainOrder",
    targetId: orderId,
    details: { domain: data.domain, weddingId, termsVersion: VERSAO_DOS_TERMOS_DE_DOMINIO, availability },
  });

  revalidatePath("/dominio");
  revalidatePath("/dominios");
  return { success: true };
}

export type ResultadoDoCancelamentoDoDominio = { success: true } | { success: false; error: string };

/** O casal desiste do pedido, enquanto ninguém começou o registro. O documento completo é apagado. */
export async function cancelarPedidoDeDominio(): Promise<ResultadoDoCancelamentoDoDominio> {
  const got = await obterContextoDaPessoa();
  if (got.error !== undefined) return { success: false, error: got.error };
  const { weddingId, session } = got.ctx;

  if (await limiteExcedido("DOMAIN_CANCEL", session.userId, 10, 10 * 60_000)) return { success: false, error: ERRO_DE_OCUPADO };

  const order = await prisma.domainOrder.findFirst({
    where: { weddingId, status: { in: [...SITUACOES_ATIVAS] } },
    select: { id: true, status: true, domain: true, holderDocument: true },
  });
  if (!order) return { success: false, error: "Não há pedido para cancelar." };
  if (order.status !== "REQUESTED") {
    return { success: false, error: "O registro já começou, então não dá mais para cancelar por aqui. Fale com a nossa equipe." };
  }

  const done = await prisma.domainOrder.updateMany({
    where: { id: order.id, weddingId, status: "REQUESTED" },
    data: { status: "CANCELED", holderDocument: esconderDocumento(order.holderDocument) },
  });
  if (done.count !== 1) return { success: false, error: "O pedido mudou enquanto vocês olhavam. Atualize a página." };

  await registrarAuditoria({ action: "domain.cancel", targetType: "DomainOrder", targetId: order.id, details: { domain: order.domain, weddingId } });
  revalidatePath("/dominio");
  revalidatePath("/dominios");
  return { success: true };
}

