import { Metadata } from "next";
import { verifyAdminSession } from "@/actions/auth-actions";
import { ScannerClient } from "./scanner-client";

export const metadata: Metadata = {
  title: "Credenciamento",
  description: "Leitor de QR Code para entrada no evento",
};

export default async function CredenciamentoPage() {
  await verifyAdminSession();

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="font-display text-[32px] leading-[38px] tracking-[-0.01em] text-tinta text-balance md:text-[40px] md:leading-[46px]">Check-in no dia</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          Aponte a câmera para o QR Code do convite para liberar a entrada do convidado.
        </p>
      </div>

      <ScannerClient />
    </div>
  );
}
