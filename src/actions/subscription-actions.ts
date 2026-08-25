"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { mpPayment, calculateCardFee } from "@/lib/mercadopago";
import { generatePixPayload } from "@/lib/pix-utils";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

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
  // Extras
  slug?: string;
  weddingDate?: Date | null;
  companyName?: string;
  vendorCategory?: string;
  vendorRegion?: string;
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

    // Se for Fornecedor, cadastra o PartnerVendor
    if (data.planType === "VENDOR") {
      const existingVendor = await prisma.partnerVendor.findFirst({
        where: { phone: data.phone },
      });

      if (!existingVendor) {
        await prisma.partnerVendor.create({
          data: {
            companyName: data.companyName || data.name,
            category: data.vendorCategory || "Outros",
            phone: data.phone,
            whatsapp: data.phone,
            serviceRegions: JSON.stringify([data.vendorRegion || "São Paulo - Capital"]),
            isVerified: data.planId !== "start",
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
    };
  } catch (error: any) {
    console.error("[registerPlanAccount Error]:", error);
    return { success: false, error: error?.message || "Erro ao registrar conta." };
  }
}
