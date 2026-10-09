"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signToken, sessionCookieOptions, hasPathAccess, SESSION_COOKIE_NAME } from "@/lib/auth";
import { isMercadoPagoConfigured, mpPayment } from "@/lib/mercadopago";
import { generatePixPayload } from "@/lib/pix-utils";
import { resolvePlan } from "@/lib/plans";
import { rateLimitByIp } from "@/lib/security/rate-limiter";
import { normalizeText, sanitizeSlug, sanitizeUrl } from "@/lib/security/sanitize";
import { uploadImageDataUrl } from "@/lib/supabase";
import { PaymentStatus, VendorPlanTier } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { applyApprovedPayment, markPaymentFailed } from "@/lib/subscriptions";
import { subscriptionReference } from "@/lib/subscription-period";
import { isUniqueViolation, provisionWedding, upsertCoupleRole, withSlugRetry } from "@/lib/account/wedding-provisioning";

/** Perfil das contas de fornecedor (o mesmo criado pelo seed). */
const VENDOR_ROLE_NAME = "Fornecedor";
const VENDOR_PANEL_PATH = "/fornecedor";

export interface PlanRegistrationData {
  planType: "COUPLE" | "VENDOR";
  planId: "basic" | "classic" | "vip" | "start" | "pro" | "master" | "custom";
  modules?: string[]; // módulos do plano personalizado
  planName: string;
  amount: number; // informativo: o servidor recalcula o preço a partir do plano
  // Dados do usuário
  name: string;
  email: string;
  phone: string;
  password?: string;
  // Extras Casal
  slug?: string;
  weddingDate?: Date | null;
  // Extras Fornecedor
  companyName?: string;
  vendorCategory?: string;
  vendorRegion?: string;
  logoUrl?: string;
  coverUrl?: string;
  galleryImages?: string[];
  startingPrice?: number; // em centavos
  averageTicket?: number; // em centavos
  priceRange?: string; // "$", "$$", "$$$", "$$$$"
  documentType?: string; // "CNPJ" | "CPF"
  documentNumber?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
}

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const RegistrationSchema = z.object({
  planId: z.string(),
  modules: z.array(z.string().max(40)).max(20).optional(),
  name: z.string().trim().min(3, "Informe seu nome completo.").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido.").max(200),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido."),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres.").max(200),
  slug: optionalText(100),
  weddingDate: z.coerce.date().optional().nullable(),
  companyName: optionalText(120),
  vendorCategory: optionalText(60),
  vendorRegion: optionalText(80),
  logoUrl: z.string().max(8_000_000).optional(),
  coverUrl: z.string().max(8_000_000).optional(),
  galleryImages: z.array(z.string().max(8_000_000)).max(8).optional(),
  startingPrice: z.coerce.number().int().min(0).max(1_000_000_00).optional(),
  averageTicket: z.coerce.number().int().min(0).max(1_000_000_00).optional(),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
  documentType: z.enum(["CNPJ", "CPF"]).optional(),
  documentNumber: optionalText(20),
  instagram: optionalText(80),
  tiktok: optionalText(80),
  website: optionalText(200),
});

/**
 * Calcula a faixa de preço ($ / $$ / $$$ / $$$$) baseado no ticket médio / valor inicial
 */
function calculatePriceRange(avgTicketInCents?: number, startingPriceInCents?: number): string {
  const value = (avgTicketInCents || startingPriceInCents || 0) / 100;
  if (value <= 3000) return "$";
  if (value <= 8000) return "$$";
  if (value <= 20000) return "$$$";
  return "$$$$";
}

/**
 * Imagens chegam como data URL do formulário público: valida tipo/tamanho e envia ao storage.
 * Também aceita URLs https já hospedadas.
 */
async function storeImage(value: string | undefined, folder: string): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith("data:")) {
    const upload = await uploadImageDataUrl(value, folder);
    if (!upload.success) throw new Error(upload.error);
    return upload.url;
  }
  const url = sanitizeUrl(value);
  return url && url.startsWith("https://") ? url : null;
}

/** Plano a cobrar: só a chave do catálogo (e os módulos do plano adaptado). O preço vem do servidor. */
export interface SubscriptionCheckoutInput {
  planId: string;
  modules?: string[];
}

const PIX_VALIDITY_MS = 10 * 60 * 1000;

/**
 * Gera a cobrança Pix (10 minutos) de um plano pago para a conta logada.
 * Cria a assinatura pendente; o plano é liberado quando o pagamento é aprovado
 * (webhook do Mercado Pago ou conferência em verifySubscriptionPaymentStatus).
 */
export async function generateSubscriptionPix(input: SubscriptionCheckoutInput) {
  try {
    const session = await getSession();
    if (!session || session.userId === SUPER_ADMIN_USER_ID) {
      return { success: false, error: "Entre na sua conta para assinar um plano." };
    }

    const modules = Array.isArray(input.modules) ? input.modules.filter((m) => typeof m === "string").slice(0, 20) : undefined;
    const plan = resolvePlan(String(input.planId ?? ""), modules);
    if (!plan) return { success: false, error: "Plano inválido." };
    if (plan.price <= 0) return { success: false, error: "Este plano é gratuito." };

    const rateLimit = await rateLimitByIp("CHECKOUT");
    if (!rateLimit.success) {
      return { success: false, error: "Muitas tentativas de geração de pagamento. Aguarde alguns minutos." };
    }

    // Plano de fornecedor só para conta de fornecedor, e vice-versa.
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, username: true, partnerVendorId: true, weddingId: true },
    });
    if (!user) return { success: false, error: "Conta não encontrada." };
    if ((plan.type === "VENDOR") !== Boolean(user.partnerVendorId)) {
      return { success: false, error: "Este plano não é para o seu tipo de conta." };
    }

    const expiresAt = new Date(Date.now() + PIX_VALIDITY_MS);
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.userId,
        planId: String(input.planId),
        planType: plan.type,
        planName: plan.name,
        // Plano de casal vale para o casamento (os dois do casal veem e usam).
        weddingId: plan.type === "COUPLE" ? user.weddingId : null,
        modules: input.planId === "custom" ? modules : undefined,
        amount: plan.price,
        expiresAt,
      },
      select: { id: true },
    });

    const email = z.string().email().safeParse(user.username);
    const name = normalizeText(user.name) || "Cliente";

    if (isMercadoPagoConfigured()) {
      try {
        const mpResponse = await mpPayment.create({
          body: {
            transaction_amount: plan.price / 100,
            payment_method_id: "pix",
            description: `Assinatura Aceito: ${plan.name}`,
            date_of_expiration: expiresAt.toISOString(),
            external_reference: subscriptionReference(subscription.id),
            payer: {
              email: email.success ? email.data : "contato@aceito.com.br",
              first_name: name.split(" ")[0],
              last_name: name.split(" ").slice(1).join(" ") || "Cliente",
            },
            metadata: { kind: "subscription", plan_id: input.planId },
          },
        });

        const mpPixPayload = mpResponse.point_of_interaction?.transaction_data?.qr_code;
        const qrCodeBase64 = mpResponse.point_of_interaction?.transaction_data?.qr_code_base64;

        if (mpPixPayload && mpResponse.id) {
          await prisma.subscription.update({ where: { id: subscription.id }, data: { gatewayId: String(mpResponse.id) } });
          return {
            success: true,
            subscriptionId: subscription.id,
            pixPayload: mpPixPayload,
            qrCodeBase64: qrCodeBase64 || null,
            expiresAt: expiresAt.getTime(),
            amount: plan.price,
            isDynamic: true,
          };
        }
      } catch (mpErr) {
        console.warn("[generateSubscriptionPix] Falha no Mercado Pago, usando Pix estático:", mpErr);
      }
    }

    // Fallback BR Code EMV estático: sem confirmação automática; a ativação fica manual.
    const pixKey = process.env.PIX_KEY?.trim();
    if (!pixKey) {
      await prisma.subscription.update({ where: { id: subscription.id }, data: { status: PaymentStatus.FAILED } });
      return { success: false, error: "Pagamento via Pix indisponível no momento." };
    }

    const txId = `ASSIN${Date.now().toString(36).toUpperCase()}`.substring(0, 18);
    const pixPayload = generatePixPayload({
      pixKey,
      merchantName: (process.env.PIX_MERCHANT_NAME || "ACEITO BRASIL").trim(),
      merchantCity: (process.env.PIX_MERCHANT_CITY || "SAO PAULO").trim(),
      amount: plan.price,
      txId,
    });
    await prisma.subscription.update({ where: { id: subscription.id }, data: { gatewayId: txId } });

    return {
      success: true,
      subscriptionId: subscription.id,
      pixPayload,
      qrCodeBase64: null,
      expiresAt: expiresAt.getTime(),
      amount: plan.price,
      isDynamic: false,
    };
  } catch (error) {
    console.error("[generateSubscriptionPix Error]:", error);
    return { success: false, error: "Erro ao gerar cobrança Pix." };
  }
}

/**
 * Confere o pagamento de uma assinatura da conta logada. Se o Mercado Pago já aprovou e o
 * webhook ainda não chegou, ativa o plano aqui mesmo (a ativação é idempotente).
 */
export async function verifySubscriptionPaymentStatus(subscriptionId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, paid: false, message: "Sessão expirada. Entre de novo." };
    if (typeof subscriptionId !== "string" || !/^[0-9a-f-]{36}$/i.test(subscriptionId)) {
      return { success: false, paid: false, message: "Cobrança não encontrada." };
    }

    const sub = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: session.userId },
      select: { id: true, status: true, gatewayId: true },
    });
    if (!sub) return { success: false, paid: false, message: "Cobrança não encontrada." };
    if (sub.status === PaymentStatus.APPROVED) return { success: true, paid: true, status: "approved" };
    if (sub.status !== PaymentStatus.PENDING) {
      return { success: false, paid: false, status: "rejected", message: "Este Pix foi recusado ou expirou. Gere um novo código." };
    }

    const rateLimit = await rateLimitByIp("PAYMENT_STATUS");
    if (!rateLimit.success) {
      return { success: true, paid: false, status: "pending", message: "Aguardando confirmação..." };
    }

    if (isMercadoPagoConfigured() && sub.gatewayId && /^\d+$/.test(sub.gatewayId)) {
      try {
        const mpResponse = await mpPayment.get({ id: sub.gatewayId });
        if (mpResponse.status === "approved") {
          const result = await applyApprovedPayment(sub.id, {
            id: String(mpResponse.id),
            amountInReais: mpResponse.transaction_amount,
          });
          if (result === "activated" || result === "already") {
            revalidatePlanPages();
            return { success: true, paid: true, status: "approved" };
          }
          return { success: false, paid: false, status: "rejected", message: "O valor pago não confere. Fale com o suporte." };
        }
        if (mpResponse.status === "rejected" || mpResponse.status === "cancelled") {
          await markPaymentFailed(sub.id);
          return { success: false, paid: false, status: mpResponse.status, message: "O Pix foi recusado ou expirou no banco." };
        }
      } catch (mpErr) {
        console.warn("[verifySubscriptionPaymentStatus MP Error]:", mpErr);
      }
    }

    return { success: true, paid: false, status: "pending", message: "Aguardando a confirmação do banco..." };
  } catch (error) {
    console.error("[verifySubscriptionPaymentStatus Error]:", error);
    return { success: false, paid: false, message: "Erro ao verificar pagamento." };
  }
}

function revalidatePlanPages() {
  revalidatePath("/fornecedor", "layout");
  revalidatePath("/fornecedores");
}

/** Data do casamento do cadastro: só datas plausíveis (o resto vira "ainda sem data"). */
function validWeddingDate(date: Date | null | undefined): Date | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const now = new Date().getUTCFullYear();
  return year >= now - 1 && year <= now + 10 ? date : null;
}

/**
 * Registra a conta do usuário (Casal ou Fornecedor).
 * Casal: cria o casamento junto com a conta e devolve redirectTo "/boas-vindas" (onboarding).
 */
export async function registerPlanAccount(data: PlanRegistrationData) {
  const plan = resolvePlan(data.planId, data.modules);
  if (!plan) return { success: false, error: "Plano inválido." };

  const parsed = RegistrationSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const input = parsed.data;

  try {
    const rateLimit = await rateLimitByIp("SIGNUP");
    if (!rateLimit.success) {
      return { success: false, error: "Muitos cadastros em pouco tempo. Aguarde alguns minutos." };
    }

    // Um e-mail já cadastrado nunca recebe sessão por aqui: o dono deve entrar pelo login.
    const existingUser = await prisma.user.findUnique({ where: { username: input.email }, select: { id: true } });
    if (existingUser) {
      return { success: false, error: "Já existe uma conta com este e-mail. Faça login para continuar." };
    }

    // Fornecedores entram direto no painel próprio (/fornecedor), já vinculados ao perfil criado.
    // Casais ganham o próprio casamento (com site e regras) e seguem para o onboarding.
    const isVendor = plan.type === "VENDOR";

    let vendorData: Parameters<typeof prisma.partnerVendor.create>[0]["data"] | null = null;
    if (plan.type === "VENDOR") {
      if (!input.companyName || !input.documentNumber) {
        return { success: false, error: "Informe o nome da empresa e o documento." };
      }

      const [logoUrl, coverUrl, gallery] = await Promise.all([
        storeImage(input.logoUrl, "vendors/logos"),
        storeImage(input.coverUrl, "vendors/covers"),
        Promise.all((input.galleryImages ?? []).map((img) => storeImage(img, "vendors/gallery"))),
      ]);

      const tier =
        data.planId === "master" ? VendorPlanTier.MASTER : data.planId === "pro" ? VendorPlanTier.PRO : VendorPlanTier.FREE;

      vendorData = {
        companyName: normalizeText(input.companyName),
        category: input.vendorCategory || "Outros",
        description: `Profissional de excelência em ${input.vendorCategory || "serviços de casamento"}.`,
        phone: input.phone,
        whatsapp: input.phone,
        logoUrl,
        coverUrl: coverUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        galleryImages: gallery.filter(Boolean).length > 0 ? JSON.stringify(gallery.filter(Boolean)) : null,
        startingPrice: input.startingPrice ?? null,
        averageTicket: input.averageTicket ?? null,
        priceRange: input.priceRange || calculatePriceRange(input.averageTicket, input.startingPrice),
        documentType: input.documentType || "CNPJ",
        documentNumber: input.documentNumber.replace(/[^\d./-]/g, ""),
        instagram: input.instagram || null,
        tiktok: input.tiktok || null,
        website: input.website ? sanitizeUrl(input.website) : null,
        serviceRegions: JSON.stringify([input.vendorRegion || "São Paulo - Capital"]),
        // O plano pago só é aplicado após confirmação do pagamento; até lá fica no gratuito.
        planTier: plan.price > 0 ? VendorPlanTier.FREE : tier,
        isVerified: false, // Fica false até aprovação na curadoria
        curationStatus: "PENDING_APPROVAL",
      };
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const name = normalizeText(input.name);

    if (!isVendor) {
      const weddingDate = validWeddingDate(input.weddingDate);
      // Casamento, site, regras, perfil "Casal" e usuário nascem juntos (tudo ou nada).
      const created = await withSlugRetry(() =>
        prisma.$transaction(async (tx) => {
          const role = await upsertCoupleRole(tx);
          const wedding = await provisionWedding(tx, {
            coupleNames: name,
            weddingDate,
            slugSource: input.slug || name,
          });
          const user = await tx.user.create({
            data: { name, username: input.email, password: hashedPassword, roleId: role.id, weddingId: wedding.id },
            select: { id: true },
          });
          return { user, role, wedding };
        }),
      ).catch(async (error) => {
        // Dois envios do mesmo formulário ao mesmo tempo: o segundo bate no e-mail único.
        if (isUniqueViolation(error) && (await prisma.user.findUnique({ where: { username: input.email }, select: { id: true } }))) {
          return null;
        }
        throw error;
      });
      if (!created) return { success: false, error: "Já existe uma conta com este e-mail. Faça login para continuar." };

      const allowedPaths = Array.isArray(created.role.allowedPaths) ? (created.role.allowedPaths as string[]) : [];
      const token = await signToken({ userId: created.user.id, role: created.role.name, allowedPaths });
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());

      return {
        success: true,
        userId: created.user.id,
        isFree: plan.price === 0,
        isVendor,
        redirectTo: "/boas-vindas",
        slug: created.wedding.slug,
      };
    }

    const role = await prisma.role.upsert({
      where: { name: VENDOR_ROLE_NAME },
      update: {},
      create: { name: VENDOR_ROLE_NAME, allowedPaths: [VENDOR_PANEL_PATH] },
    });

    const user = await prisma.$transaction(async (tx) => {
      const vendor = vendorData ? await tx.partnerVendor.create({ data: vendorData, select: { id: true } }) : null;
      return tx.user.create({
        data: {
          name,
          username: input.email,
          password: hashedPassword,
          roleId: role.id,
          // O vínculo nasce no servidor: o fornecedor só enxerga o próprio perfil no painel.
          partnerVendorId: vendor?.id ?? null,
        },
        select: { id: true },
      });
    });

    const allowedPaths = Array.isArray(role.allowedPaths) ? (role.allowedPaths as string[]) : [];
    const token = await signToken({ userId: user.id, role: role.name, allowedPaths });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());

    return {
      success: true,
      userId: user.id,
      isFree: plan.price === 0,
      isVendor,
      redirectTo: hasPathAccess(allowedPaths, VENDOR_PANEL_PATH) ? VENDOR_PANEL_PATH : null,
      slug: input.slug ? sanitizeSlug(input.slug) : undefined,
    };
  } catch (error) {
    console.error("[registerPlanAccount Error]:", error);
    const message = error instanceof Error && /imagem|Imagem|Formato/.test(error.message) ? error.message : null;
    return { success: false, error: message || "Erro ao registrar conta." };
  }
}
