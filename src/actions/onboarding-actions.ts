"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { obterSessao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { normalizarTexto } from "@/lib/security/sanitize";
import { COR_PADRAO_DO_TEMA, FAIXAS_DE_CONVIDADOS, TEMAS_PRONTOS, juntarNomesDoCasal } from "@/lib/onboarding-options";
import {
  classificarConta,
  ehEnderecoAutomatico,
  prepararCasamento,
  renovarCookieDeSessao,
  enderecoUnicoDoCasamento,
  criarOuAtualizarPapelDoCasal,
  comNovaTentativaDeEndereco,
} from "@/lib/account/wedding-provisioning";

import { ERROS } from "@/lib/mensagens-de-erro";
const nomeDaPessoa = (label: string) =>
  z
    .string()
    .transform((v) => normalizarTexto(v).replace(/[&+]/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(2, `Informe ${label}.`).max(60, `${label[0].toUpperCase()}${label.slice(1)} está longo demais.`));

const CORES_DOS_TEMAS = TEMAS_PRONTOS.map((p) => p.hex) as [string, ...string[]];

const EsquemaDoInicio = z.object({
  yourName: nomeDaPessoa("o seu nome"),
  partnerName: nomeDaPessoa("o nome de quem vai casar com você"),
  /** "AAAA-MM-DD", ou null quando o casal ainda não tem a data. */
  weddingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .nullable(),
  city: z
    .string()
    .max(80, "Cidade longa demais.")
    .transform((v) => normalizarTexto(v))
    .optional(),
  guestEstimate: z.enum(FAIXAS_DE_CONVIDADOS).nullable().optional(),
  // Cor, cidade e faixa de convidados saíram do onboarding (ficam em Editar o site); seguem aceitos se vierem.
  themeColor: z.enum(CORES_DOS_TEMAS).optional(),
});

export type EntradaDoInicio = z.input<typeof EsquemaDoInicio>;

export type ResultadoDoInicio =
  | { success: true; slug: string; coupleNames: string }
  | { success: false; error: string; redirectTo?: string };

/** "2027-10-11" -> meio-dia em Brasília (evita virar o dia anterior ao exibir). */
function interpretarDataDoCasamento(value: string | null): Date | null | "invalid" {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 15));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return "invalid";
  const year = new Date().getUTCFullYear();
  if (y < year - 1 || y > year + 10) return "invalid";
  return date;
}

class ConflitoNoInicio extends Error {}

/**
 * Conclui o onboarding do casamento da conta logada.
 * - Conta de casal sem casamento (cadastros antigos "aguardando ativação"): cria o casamento e
 *   troca o perfil para "Casal".
 * - Atualiza nomes e data (e cidade, faixa de convidados e cor, só se vierem); o endereço do site é
 *   refeito a partir dos nomes enquanto ainda for o automático. Marca onboardedAt.
 */
export async function concluirInicio(input: EntradaDoInicio): Promise<ResultadoDoInicio> {
  const session = await obterSessao();
  if (!session) return { success: false, error: ERROS.sessaoExpirada, redirectTo: "/login" };
  if (session.userId === ID_DO_SUPER_ADMIN) {
    return { success: false, error: "A conta de emergência não tem casamento próprio.", redirectTo: "/dashboard" };
  }

  const parsed = EsquemaDoInicio.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  const data = parsed.data;

  const weddingDate = interpretarDataDoCasamento(data.weddingDate);
  if (weddingDate === "invalid") return { success: false, error: "Confira a data do casamento." };

  const limit = await conferirLimiteDeUso({ key: `ONBOARDING:${session.userId}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.success) return { success: false, error: ERROS.muitasTentativas };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      weddingId: true,
      partnerVendorId: true,
      role: { select: { name: true, allowedPaths: true } },
      wedding: { select: { id: true, slug: true, coupleNames: true, onboardedAt: true } },
    },
  });
  if (!user) return { success: false, error: "Conta não encontrada.", redirectTo: "/login" };

  const kind = classificarConta(user);
  if (kind === "vendor") return { success: false, error: "Contas de fornecedor usam o painel do fornecedor.", redirectTo: "/fornecedor" };
  if (kind === "admin" && !user.wedding) {
    return { success: false, error: "Contas da administração não têm casamento próprio.", redirectTo: "/dashboard" };
  }
  if (user.wedding?.onboardedAt) return { success: false, error: "O casamento já está configurado.", redirectTo: "/dashboard" };

  const coupleNames = juntarNomesDoCasal(data.yourName, data.partnerName);
  // Campo que não veio fica como está (o onboarding curto não pergunta cidade, convidados nem cor).
  const optional = {
    ...(data.city !== undefined ? { city: data.city || null } : {}),
    ...(data.guestEstimate !== undefined ? { guestEstimate: data.guestEstimate } : {}),
    ...(data.themeColor ? { themeColor: data.themeColor } : {}),
  };
  // Cadastros antigos ficaram com um perfil sem módulos: passam ao perfil "Casal".
  const paths = Array.isArray(user.role.allowedPaths) ? (user.role.allowedPaths as string[]) : [];
  const needsCoupleRole = kind === "couple" && paths.length === 0;

  try {
    const slug = await comNovaTentativaDeEndereco(() =>
      prisma.$transaction(async (tx) => {
        let weddingId: string;
        let slug: string;

        if (!user.wedding) {
          const role = await criarOuAtualizarPapelDoCasal(tx);
          const wedding = await prepararCasamento(tx, { coupleNames, weddingDate });
          // Só vincula se a conta continua sem casamento (duas abas concluindo ao mesmo tempo).
          const linked = await tx.user.updateMany({
            where: { id: user.id, weddingId: null },
            data: { weddingId: wedding.id, roleId: role.id },
          });
          if (linked.count !== 1) throw new ConflitoNoInicio();
          weddingId = wedding.id;
          slug = wedding.slug;
        } else {
          weddingId = user.wedding.id;
          slug = ehEnderecoAutomatico(user.wedding.slug, user.wedding.coupleNames)
            ? await enderecoUnicoDoCasamento(tx, coupleNames, weddingId)
            : user.wedding.slug;
          if (needsCoupleRole) {
            const role = await criarOuAtualizarPapelDoCasal(tx);
            await tx.user.update({ where: { id: user.id }, data: { roleId: role.id } });
          }
        }

        const updated = await tx.wedding.updateMany({
          where: { id: weddingId, onboardedAt: null },
          data: { coupleNames, slug, weddingDate, ...optional, onboardedAt: new Date() },
        });
        if (updated.count !== 1) throw new ConflitoNoInicio();

        await tx.siteCustomization.upsert({
          where: { weddingId },
          update: { title: coupleNames, slug, weddingDate, ...(data.themeColor ? { themeColor: data.themeColor } : {}) },
          create: {
            weddingId,
            slug,
            title: coupleNames,
            subtitle: "",
            weddingDate,
            themeColor: data.themeColor ?? COR_PADRAO_DO_TEMA,
            ceremonyTime: null,
            receptionTime: null,
            locationName: null,
            locationAddress: null,
            dressCodeTitle: null,
          },
        });
        await tx.systemSettings.upsert({
          where: { weddingId },
          update: { weddingDate },
          create: { weddingId, weddingDate, welcomeText: "Bem-vindos ao nosso casamento!" },
        });

        return slug;
      }),
    );

    if (!user.wedding || needsCoupleRole) await renovarCookieDeSessao(user.id);
    revalidatePath("/", "layout");

    return { success: true, slug, coupleNames };
  } catch (error) {
    if (error instanceof ConflitoNoInicio) {
      return { success: false, error: "O casamento já foi configurado em outra aba.", redirectTo: "/dashboard" };
    }
    console.error("[completeOnboarding]", error);
    return { success: false, error: "Não conseguimos salvar agora. Tente de novo em instantes." };
  }
}
