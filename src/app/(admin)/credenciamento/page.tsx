import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { casamentoTemModulo } from "@/lib/wedding-plan";
import { UpgradeCard } from "@/components/plan/upgrade-card";
import { ScannerClient } from "./scanner-client";

export const metadata: Metadata = {
  title: "Registro de entrada dos convidados",
  description: "Leitor de código QR para registrar a entrada dos convidados na festa",
};

export const dynamic = "force-dynamic";

export default async function CredenciamentoPage() {
  const { session, weddingId } = await requireWeddingPage("/credenciamento");
  if (!(await casamentoTemModulo({ weddingId, session }, "qrcode"))) return <UpgradeCard moduleId="qrcode" />;

  // Só leitura: quem já entrou e quantos confirmaram
  const [arrived, confirmed] = await Promise.all([
    prisma.guest.count({ where: { weddingId, isPresent: true } }),
    prisma.guest.count({ where: { weddingId, rsvpStatus: "CONFIRMED" } }),
  ]);

  return <ScannerClient initialArrived={arrived} confirmed={confirmed} />;
}
