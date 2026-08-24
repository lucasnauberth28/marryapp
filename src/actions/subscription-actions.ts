"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { mpPayment, calculateCardFee } from "@/lib/mercadopago";
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
  weddingDate?: Date | null;
  companyName?: string;
  vendorCategory?: string;
  vendorRegion?: string;
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

    // Se for Casal, atualiza o SiteCustomization com os nomes
    if (data.planType === "COUPLE") {
      await prisma.siteCustomization.upsert({
        where: { id: "global" },
        update: {
          title: data.name,
          weddingDate: data.weddingDate || undefined,
        },
        create: {
          id: "global",
          title: data.name,
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

    return { success: true, userId: user.id, isFree: data.amount === 0 };
  } catch (error: any) {
    console.error("[registerPlanAccount Error]:", error);
    return { success: false, error: error?.message || "Erro ao registrar conta." };
  }
}
