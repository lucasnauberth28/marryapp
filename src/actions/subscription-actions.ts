"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signToken, sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth";
import { isMercadoPagoConfigured, mpPayment } from "@/lib/mercadopago";
import { generatePixPayload } from "@/lib/pix-utils";
import { resolvePlan } from "@/lib/plans";
import { rateLimitByIp } from "@/lib/security/rate-limiter";
import { normalizeText, sanitizeSlug, sanitizeUrl } from "@/lib/security/sanitize";
import { uploadImageDataUrl } from "@/lib/supabase";
import { VendorPlanTier } from "@prisma/client";

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

/**
 * Gera uma cobrança Pix temporária (10 minutos) para a assinatura.
 * O valor é sempre o do catálogo de planos, nunca o enviado pelo navegador.
 */
export async function generateSubscriptionPix(data: PlanRegistrationData) {
  try {
    const plan = resolvePlan(data.planId, data.modules);
    if (!plan) return { success: false, error: "Plano inválido." };
    if (plan.price <= 0) return { success: false, error: "Este plano é gratuito." };

    const rateLimit = await rateLimitByIp("CHECKOUT");
    if (!rateLimit.success) {
      return { success: false, error: "Muitas tentativas de geração de pagamento. Aguarde alguns minutos." };
    }

    const email = z.string().email().safeParse(data.email?.trim().toLowerCase());
    const name = normalizeText(data.name) || "Cliente";
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (isMercadoPagoConfigured()) {
      try {
        const mpResponse = await mpPayment.create({
          body: {
            transaction_amount: plan.price / 100,
            payment_method_id: "pix",
            description: `Assinatura MarryApp: ${plan.name}`,
            date_of_expiration: expiresAt.toISOString(),
            payer: {
              email: email.success ? email.data : "contato@marryapp.com.br",
              first_name: name.split(" ")[0],
              last_name: name.split(" ").slice(1).join(" ") || "Cliente",
            },
            metadata: { kind: "subscription", plan_id: data.planId },
          },
        });

        const mpPixPayload = mpResponse.point_of_interaction?.transaction_data?.qr_code;
        const qrCodeBase64 = mpResponse.point_of_interaction?.transaction_data?.qr_code_base64;

        if (mpPixPayload) {
          return {
            success: true,
            pixPayload: mpPixPayload,
            qrCodeBase64: qrCodeBase64 || null,
            gatewayId: String(mpResponse.id),
            expiresAt: expiresAt.getTime(),
            amount: plan.price,
            isDynamic: true,
          };
        }
      } catch (mpErr) {
        console.warn("[generateSubscriptionPix] Falha no Mercado Pago, usando Pix estático:", mpErr);
      }
    }

    // Fallback BR Code EMV estático: exige conferência manual do pagamento
    const pixKey = process.env.PIX_KEY?.trim();
    if (!pixKey) return { success: false, error: "Pagamento via Pix indisponível no momento." };

    const txId = `ASSIN${Date.now().toString(36).toUpperCase()}`.substring(0, 18);
    const pixPayload = generatePixPayload({
      pixKey,
      merchantName: (process.env.PIX_MERCHANT_NAME || "MARRYAPP BRASIL").trim(),
      merchantCity: (process.env.PIX_MERCHANT_CITY || "SAO PAULO").trim(),
      amount: plan.price,
      txId,
    });

    return {
      success: true,
      pixPayload,
      qrCodeBase64: null,
      gatewayId: txId,
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
 * Verifica se o pagamento Pix da assinatura foi confirmado no Mercado Pago (somente leitura).
 */
export async function verifySubscriptionPaymentStatus(gatewayId: string) {
  try {
    if (!gatewayId) {
      return { success: false, paid: false, message: "Identificador de transação não informado." };
    }

    const rateLimit = await rateLimitByIp("PAYMENT_STATUS");
    if (!rateLimit.success) {
      return { success: true, paid: false, status: "pending", message: "Aguardando confirmação..." };
    }

    if (isMercadoPagoConfigured() && /^\d+$/.test(gatewayId)) {
      try {
        const mpResponse = await mpPayment.get({ id: gatewayId });
        const status = mpResponse.status;

        if (status === "approved") {
          return {
            success: true,
            paid: true,
            status: "approved",
            message: "Pagamento identificado e aprovado pelo Mercado Pago! 🎉",
          };
        } else if (status === "rejected" || status === "cancelled") {
          return {
            success: false,
            paid: false,
            status,
            message: "O pagamento via Pix foi recusado ou expirou no banco.",
          };
        }
      } catch (mpErr) {
        console.warn("[verifySubscriptionPaymentStatus MP Error]:", mpErr);
      }
    }

    return {
      success: true,
      paid: false,
      status: "pending",
      message: "Aguardando confirmação de compensação do Pix pelo banco...",
    };
  } catch (error) {
    console.error("[verifySubscriptionPaymentStatus Error]:", error);
    return { success: false, paid: false, message: "Erro ao verificar pagamento." };
  }
}

/**
 * Registra a conta do usuário (Casal ou Fornecedor).
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

    // Fornecedores só acessam o marketplace público até existir um portal próprio.
    // Casais aguardam ativação: até o isolamento de dados por casamento, uma conta nova
    // não pode enxergar o painel existente.
    const roleName = plan.type === "COUPLE" ? "Casal / Noivos (aguardando ativação)" : "Fornecedor Parceiro";
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, allowedPaths: [] },
    });

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

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: normalizeText(input.name),
          username: input.email,
          password: hashedPassword,
          roleId: role.id,
        },
      });
      if (vendorData) await tx.partnerVendor.create({ data: vendorData });
      return created;
    });

    const token = await signToken({
      userId: user.id,
      role: role.name,
      allowedPaths: Array.isArray(role.allowedPaths) ? (role.allowedPaths as string[]) : [],
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());

    return {
      success: true,
      userId: user.id,
      isFree: plan.price === 0,
      isVendor: plan.type === "VENDOR",
      slug: input.slug ? sanitizeSlug(input.slug) : undefined,
    };
  } catch (error) {
    console.error("[registerPlanAccount Error]:", error);
    const message = error instanceof Error && /imagem|Imagem|Formato/.test(error.message) ? error.message : null;
    return { success: false, error: message || "Erro ao registrar conta." };
  }
}
