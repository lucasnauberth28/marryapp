"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { normalizeText } from "@/lib/security/sanitize";
import { GUEST_RANGES, THEME_PRESETS, joinCoupleNames } from "@/lib/onboarding-options";
import {
  classifyAccount,
  isAutoSlug,
  provisionWedding,
  refreshSessionCookie,
  uniqueWeddingSlug,
  upsertCoupleRole,
  withSlugRetry,
} from "@/lib/account/wedding-provisioning";

const personName = (label: string) =>
  z
    .string()
    .transform((v) => normalizeText(v).replace(/[&+]/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(2, `Informe ${label}.`).max(60, `${label[0].toUpperCase()}${label.slice(1)} está longo demais.`));

const THEME_HEXES = THEME_PRESETS.map((p) => p.hex) as [string, ...string[]];

const OnboardingSchema = z.object({
  yourName: personName("o seu nome"),
  partnerName: personName("o nome de quem vai casar com você"),
  /** "AAAA-MM-DD", ou null quando o casal ainda não tem a data. */
  weddingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .nullable(),
  city: z
    .string()
    .max(80, "Cidade longa demais.")
    .transform((v) => normalizeText(v))
    .optional(),
  guestEstimate: z.enum(GUEST_RANGES).nullable().optional(),
  themeColor: z.enum(THEME_HEXES),
});

export type OnboardingInput = z.input<typeof OnboardingSchema>;

export type OnboardingResult =
  | { success: true; slug: string; coupleNames: string }
  | { success: false; error: string; redirectTo?: string };

/** "2027-10-11" -> meio-dia em Brasília (evita virar o dia anterior ao exibir). */
function parseWeddingDate(value: string | null): Date | null | "invalid" {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 15));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return "invalid";
  const year = new Date().getUTCFullYear();
  if (y < year - 1 || y > year + 10) return "invalid";
  return date;
}

class OnboardingConflict extends Error {}

/**
 * Conclui o onboarding do casamento da conta logada.
 * - Conta de casal sem casamento (cadastros antigos "aguardando ativação"): cria o casamento e
 *   troca o perfil para "Casal".
 * - Atualiza nomes, data, cidade, faixa de convidados e cor; o endereço do site é refeito a partir
 *   dos nomes enquanto ainda for o automático. Marca onboardedAt.
 */
export async function completeOnboarding(input: OnboardingInput): Promise<OnboardingResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Sua sessão expirou. Entre de novo.", redirectTo: "/login" };
  if (session.userId === SUPER_ADMIN_USER_ID) {
    return { success: false, error: "A conta de emergência não tem casamento próprio.", redirectTo: "/dashboard" };
  }

  const parsed = OnboardingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  const data = parsed.data;

  const weddingDate = parseWeddingDate(data.weddingDate);
  if (weddingDate === "invalid") return { success: false, error: "Confira a data do casamento." };

  const limit = await checkRateLimit({ key: `ONBOARDING:${session.userId}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.success) return { success: false, error: "Muitas tentativas seguidas. Aguarde alguns minutos." };

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

  const kind = classifyAccount(user);
  if (kind === "vendor") return { success: false, error: "Contas de fornecedor usam o painel do fornecedor.", redirectTo: "/fornecedor" };
  if (kind === "admin" && !user.wedding) {
    return { success: false, error: "Contas da administração não têm casamento próprio.", redirectTo: "/dashboard" };
  }
  if (user.wedding?.onboardedAt) return { success: false, error: "O casamento já está configurado.", redirectTo: "/dashboard" };

  const coupleNames = joinCoupleNames(data.yourName, data.partnerName);
  const city = data.city || null;
  const guestEstimate = data.guestEstimate ?? null;
  const themeColor = data.themeColor;
  // Cadastros antigos ficaram com um perfil sem módulos: passam ao perfil "Casal".
  const paths = Array.isArray(user.role.allowedPaths) ? (user.role.allowedPaths as string[]) : [];
  const needsCoupleRole = kind === "couple" && paths.length === 0;

  try {
    const slug = await withSlugRetry(() =>
      prisma.$transaction(async (tx) => {
        let weddingId: string;
        let slug: string;

        if (!user.wedding) {
          const role = await upsertCoupleRole(tx);
          const wedding = await provisionWedding(tx, { coupleNames, weddingDate });
          // Só vincula se a conta continua sem casamento (duas abas concluindo ao mesmo tempo).
          const linked = await tx.user.updateMany({
            where: { id: user.id, weddingId: null },
            data: { weddingId: wedding.id, roleId: role.id },
          });
          if (linked.count !== 1) throw new OnboardingConflict();
          weddingId = wedding.id;
          slug = wedding.slug;
        } else {
          weddingId = user.wedding.id;
          slug = isAutoSlug(user.wedding.slug, user.wedding.coupleNames)
            ? await uniqueWeddingSlug(tx, coupleNames, weddingId)
            : user.wedding.slug;
          if (needsCoupleRole) {
            const role = await upsertCoupleRole(tx);
            await tx.user.update({ where: { id: user.id }, data: { roleId: role.id } });
          }
        }

        const updated = await tx.wedding.updateMany({
          where: { id: weddingId, onboardedAt: null },
          data: { coupleNames, slug, weddingDate, city, guestEstimate, themeColor, onboardedAt: new Date() },
        });
        if (updated.count !== 1) throw new OnboardingConflict();

        await tx.siteCustomization.upsert({
          where: { weddingId },
          update: { title: coupleNames, slug, weddingDate, themeColor },
          create: {
            weddingId,
            slug,
            title: coupleNames,
            subtitle: "",
            weddingDate,
            themeColor,
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

    if (!user.wedding || needsCoupleRole) await refreshSessionCookie(user.id);
    revalidatePath("/", "layout");

    return { success: true, slug, coupleNames };
  } catch (error) {
    if (error instanceof OnboardingConflict) {
      return { success: false, error: "O casamento já foi configurado em outra aba.", redirectTo: "/dashboard" };
    }
    console.error("[completeOnboarding]", error);
    return { success: false, error: "Não conseguimos salvar agora. Tente de novo em instantes." };
  }
}
