"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { mpPayment, calculateCardFee } from "@/lib/mercadopago";
import { generatePixPayload } from "@/lib/pix-utils";
import { PaymentMethod, PaymentStatus, VendorPlanTier } from "@prisma/client";

const COOKIE_NAME = "marryapp_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export interface PlanRegistrationData {
  planType: "COUPLE" | "VENDOR";
  planId: "basic" | "classic" | "vip" | "start" | "pro" | "master";
  planName: string;
  amount: number; // em centavos (0 para gratis)
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
 * Gera uma cobrança Pix temporária com expiração exata de 10 minutos para a assinatura
 */
export async function generateSubscriptionPix(data: PlanRegistrationData) {
  try {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    const expirationIso = expiresAt.toISOString();

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    if (mpToken && data.amount > 0) {
      try {
        const mpResponse = await mpPayment.create({
          body: {
            transaction_amount: data.amount / 100,
            payment_method_id: "pix",
            description: `Assinatura MarryApp: ${data.planName}`,
            date_of_expiration: expirationIso,
            payer: {
              email: data.email && data.email.includes("@") ? data.email : "contato@marryapp.com.br",
              first_name: data.name.split(" ")[0],
              last_name: data.name.split(" ").slice(1).join(" ") || "Cliente",
            },
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
            amount: data.amount,
            isDynamic: true,
          };
        }
      } catch (mpErr) {
        console.warn("[generateSubscriptionPix MP Error, using standard EMV Pix fallback]:", mpErr);
      }
    }

    // Fallback padrão BR Code EMV oficial (Banco Central) com CRC16 válido
    const pixKey = (process.env.PIX_KEY || "11967794744").trim();
    const merchantName = (process.env.PIX_MERCHANT_NAME || "MARRYAPP BRASIL").trim();
    const merchantCity = (process.env.PIX_MERCHANT_CITY || "SAO PAULO").trim();
    const txId = `ASSIN${Date.now().toString(36).toUpperCase()}`.substring(0, 18);

    const pixPayload = generatePixPayload({
      pixKey,
      merchantName,
      merchantCity,
      amount: data.amount,
      txId,
    });

    return {
      success: true,
      pixPayload,
      qrCodeBase64: null,
      gatewayId: txId,
      expiresAt: expiresAt.getTime(),
      amount: data.amount,
      isDynamic: false,
    };
  } catch (error: any) {
    console.error("[generateSubscriptionPix Error]:", error);
    return { success: false, error: error?.message || "Erro ao gerar cobrança Pix." };
  }
}

/**
 * Verifica se o pagamento Pix da assinatura foi confirmado no Mercado Pago (Webhook ou Consulta Direta)
 */
export async function verifySubscriptionPaymentStatus(gatewayId: string) {
  try {
    if (!gatewayId) {
      return { success: false, paid: false, message: "Identificador de transação não informado." };
    }

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

    // Consulta direta à API do Mercado Pago se houver token
    if (mpToken && /^\d+$/.test(gatewayId)) {
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
        } else {
          return {
            success: true,
            paid: false,
            status: status || "pending",
            message: "Aguardando confirmação de compensação do Pix pelo banco...",
          };
        }
      } catch (mpErr: any) {
        console.warn("[verifySubscriptionPaymentStatus MP Error]:", mpErr?.message || mpErr);
      }
    }

    // Se estiver rodando em ambiente sem credenciais ativas do Mercado Pago
    return {
      success: true,
      paid: false,
      status: "pending",
      message: "Aguardando confirmação de compensação do Pix pelo banco...",
    };
  } catch (error: any) {
    console.error("[verifySubscriptionPaymentStatus Error]:", error);
    return { success: false, paid: false, message: error?.message || "Erro ao verificar pagamento." };
  }
}

/**
 * Registra a conta do usuário (Casal ou Fornecedor) e inicializa a assinatura
 */
export async function registerPlanAccount(data: PlanRegistrationData) {
  try {
    const existingUser = await prisma.user.findFirst({
      where: { username: data.email },
    });

    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      // Cria ou busca a Role correspondente
      const roleName = data.planType === "COUPLE" ? "Casal / Noivos" : "Fornecedor Parceiro";
      let role = await prisma.role.findFirst({
        where: { name: roleName },
      });

      if (!role) {
        role = await prisma.role.create({
          data: {
            name: roleName,
            allowedPaths: data.planType === "COUPLE" ? ["*"] : ["/fornecedores", "/mensagens"],
          },
        });
      }

      const hashedPassword = bcrypt.hashSync(data.password || "marryapp123", 10);

      user = await prisma.user.create({
        data: {
          name: data.name,
          username: data.email,
          password: hashedPassword,
          roleId: role.id,
        },
      });
    }

    // Se for Fornecedor, cadastra o PartnerVendor com processo de curadoria
    if (data.planType === "VENDOR") {
      const calculatedRange = calculatePriceRange(data.averageTicket, data.startingPrice);
      const tier =
        data.planId === "master"
          ? VendorPlanTier.MASTER
          : data.planId === "pro"
          ? VendorPlanTier.PRO
          : VendorPlanTier.FREE;

      const existingVendor = await prisma.partnerVendor.findFirst({
        where: { phone: data.phone },
      });

      if (!existingVendor) {
        await prisma.partnerVendor.create({
          data: {
            companyName: data.companyName || data.name,
            category: data.vendorCategory || "Outros",
            description: `Profissional de excelência em ${data.vendorCategory || "serviços de casamento"}.`,
            phone: data.phone,
            whatsapp: data.phone,
            logoUrl: data.logoUrl || null,
            coverUrl: data.coverUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
            galleryImages: data.galleryImages ? JSON.stringify(data.galleryImages) : null,
            startingPrice: data.startingPrice || null,
            averageTicket: data.averageTicket || null,
            priceRange: data.priceRange || calculatedRange,
            documentType: data.documentType || "CNPJ",
            documentNumber: data.documentNumber || null,
            instagram: data.instagram || null,
            tiktok: data.tiktok || null,
            website: data.website || null,
            serviceRegions: JSON.stringify([data.vendorRegion || "São Paulo - Capital"]),
            planTier: tier,
            isVerified: false, // Fica false até aprovação na curadoria
            curationStatus: "PENDING_APPROVAL", // Entra na fila de curadoria por segurança
          },
        });
      }
    }

    // Se for Casal, atualiza o SiteCustomization com os nomes e slug
    if (data.planType === "COUPLE") {
      const formattedSlug = (data.slug || data.name)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      await prisma.siteCustomization.upsert({
        where: { id: "global" },
        update: {
          title: data.name,
          slug: formattedSlug || "lucas-e-giovanna",
          weddingDate: data.weddingDate || undefined,
        },
        create: {
          id: "global",
          title: data.name,
          slug: formattedSlug || "lucas-e-giovanna",
          weddingDate: data.weddingDate || undefined,
        },
      });
    }

    // Gera o token de sessão e faz login automático
    const token = await signToken({
      userId: user.id,
      role: "Admin",
      allowedPaths: ["*"],
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return {
      success: true,
      userId: user.id,
      isFree: data.amount === 0,
      isVendor: data.planType === "VENDOR",
    };
  } catch (error: any) {
    console.error("[registerPlanAccount Error]:", error);
    return { success: false, error: error?.message || "Erro ao registrar conta." };
  }
}
