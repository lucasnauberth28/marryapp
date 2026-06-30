import { Metadata } from "next";
import { verifyAdminSession } from "@/actions/auth-actions";
import { ScannerClient } from "./scanner-client";

export const metadata: Metadata = {
  title: "Credenciamento | Lucas & Giovanna",
  description: "Leitor de QR Code para entrada no evento",
};

export default async function CredenciamentoPage() {
  await verifyAdminSession();

  return (
    <div className="flex-1 p-8 pt-6 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Credenciamento (Check-in)</h1>
        <p className="text-zinc-500 mt-1">
          Aponte a câmera para o Ingresso (QR Code) do convidado para liberar a entrada.
        </p>
      </div>

      <ScannerClient />
    </div>
  );
}
