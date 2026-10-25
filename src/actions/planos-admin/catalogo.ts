"use server";

// Administração de planos: preços e nomes do catálogo.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { PRECO_MAXIMO_EM_CENTAVOS, TAMANHO_MAXIMO_DO_NOME, TAMANHO_MINIMO_DO_NOME, PRECO_MINIMO_PAGO_EM_CENTAVOS, limparNome, catalogoPadrao, ehChaveDePlanoDoCatalogo, ehPlanoGratis, mesclarCatalogo } from "@/lib/pagamento/catalog";
import { MODULOS_DO_CASAL } from "@/lib/pagamento/pricing-modules";
import { CONFIGURACAO_DOS_PLANOS } from "@/lib/pagamento/plans";
import { type ResultadoDaAcaoDePlanos, TextoValido, falhar } from "@/actions/planos-admin/comum";

const EsquemaDaChave = z.string().regex(/^(plan|module):[A-Za-z0-9_-]{1,40}$/, "Item inválido.");

/** O item existe no catálogo do código? Devolve o preço e o nome de fábrica, e se é gratuito. */
function itemDoCatalogo(key: string): { baseName: string; basePrice: number; free: boolean } | null {
  const [kind, id] = key.split(":");
  if (kind === "plan") {
    return ehChaveDePlanoDoCatalogo(catalogoPadrao(), id) ? { baseName: CONFIGURACAO_DOS_PLANOS[id].name, basePrice: CONFIGURACAO_DOS_PLANOS[id].price, free: ehPlanoGratis(id) } : null;
  }
  const mod = MODULOS_DO_CASAL.find((m) => m.id === id);
  return mod ? { baseName: mod.name, basePrice: mod.price, free: false } : null;
}

type ItemDoCatalogo = NonNullable<ReturnType<typeof itemDoCatalogo>>;

/** Preço e nome em vigor antes da edição (a linha do banco, ou o padrão do código). */
async function valorAnteriorDoItem(key: string, item: ItemDoCatalogo): Promise<{ price: number; name: string }> {
  const before = await prisma.catalogPrice.findUnique({ where: { key }, select: { priceCents: true, name: true } });
  const current = mesclarCatalogo(before ? [{ key, priceCents: before.priceCents, name: before.name }] : []);
  const [, id] = key.split(":");
  if (key.startsWith("plan:")) {
    const plan = current.plans[id as keyof typeof current.plans];
    return { price: plan.price, name: plan.name };
  }
  const modulo = current.modules.find((m) => m.id === id);
  return { price: modulo?.price ?? item.basePrice, name: modulo?.name ?? item.baseName };
}

/** Igual ao padrão do código: some a linha (o código volta a valer); senão grava a edição. */
async function gravarEdicaoDoCatalogo(data: { key: string; priceCents: number; reason: string }, name: string, item: ItemDoCatalogo, admin: { userId: string; name?: string | null }) {
  if (data.priceCents === item.basePrice && name === item.baseName) {
    await prisma.catalogPrice.deleteMany({ where: { key: data.key } });
    return;
  }
  const campos = { priceCents: data.priceCents, name: name === item.baseName ? null : name, reason: data.reason, updatedById: admin.userId, updatedByName: admin.name ?? "Administrador" };
  await prisma.catalogPrice.upsert({ where: { key: data.key }, create: { key: data.key, ...campos }, update: campos });
}

/**
 * Salva nome e preço de um plano ou módulo. Vale só para compras novas (a cobrança já feita guarda o valor).
 * Plano gratuito mantém o preço zero e só troca de nome. O motivo é obrigatório e o antes e depois vão ao registro.
 */
export async function salvarPrecoDoCatalogo(input: unknown): Promise<ResultadoDaAcaoDePlanos> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const data = z
      .object({
        key: EsquemaDaChave,
        name: z.string().max(200),
        priceCents: z.coerce.number().int("Informe o preço em reais, com centavos."),
        reason: TextoValido(5, 300, "Conte o motivo da mudança."),
      })
      .parse(input);
    const item = itemDoCatalogo(data.key);
    if (!item) return { success: false, error: "Item não encontrado no catálogo." };
    const name = limparNome(data.name);
    if (!name) return { success: false, error: `O nome precisa ter de ${TAMANHO_MINIMO_DO_NOME} a ${TAMANHO_MAXIMO_DO_NOME} letras.` };
    if (item.free) {
      if (data.priceCents !== 0) return { success: false, error: "Este plano é gratuito e continua gratuito. Só o nome pode mudar." };
    } else if (data.priceCents < PRECO_MINIMO_PAGO_EM_CENTAVOS || data.priceCents > PRECO_MAXIMO_EM_CENTAVOS) {
      return { success: false, error: "O preço precisa ficar entre R$ 1,00 e R$ 10.000,00." };
    }

    const anterior = await valorAnteriorDoItem(data.key, item);
    if (anterior.price === data.priceCents && anterior.name === name) return { success: false, error: "Nada mudou. Altere o nome ou o preço para salvar." };

    await gravarEdicaoDoCatalogo(data, name, item, admin);
    await registrarAuditoria({
      action: "catalog.price_update",
      targetType: "catalog_price",
      targetId: data.key,
      details: { before: { priceCents: anterior.price, name: anterior.name }, after: { priceCents: data.priceCents, name }, reason: data.reason },
    });
    // Páginas públicas com preço: refazem na hora
    for (const path of ["/", "/planos", "/monte-seu-plano", "/cadastro", "/login"]) revalidatePath(path);
    revalidatePath("/admin/planos", "layout");
    return { success: true, message: "Preço salvo. Vale só para compras novas: quem já pagou mantém o valor." };
  } catch (error) {
    return falhar(error, "saveCatalogPriceAction");
  }
}
