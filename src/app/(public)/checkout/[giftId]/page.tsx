import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { guestPageMetadata, getWeddingIdentity } from "@/lib/wedding";
import { notFound } from "next/navigation";
import { CheckoutClient } from "./checkout-client";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return guestPageMetadata("Presentear", "Pagamento seguro por Pix ou cartão.");
}

interface CheckoutPageProps {
  params: Promise<{
    giftId: string;
  }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const resolvedParams = await params;
  const giftId = resolvedParams.giftId;

  const gift = await prisma.gift.findUnique({
    where: { id: giftId },
  });

  if (!gift) {
    notFound();
  }

  const { coupleNames } = await getWeddingIdentity();

  return (
    <div className="min-h-screen bg-linho flex flex-col justify-between py-8 px-4 sm:px-6 w-full animate-in fade-in duration-300 font-sans">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Top Header Imersivo sem Nav Links */}
        <div className="flex items-center justify-between pb-2 border-b border-linha/60">
          <Link
            href="/presentes"
            className="text-xs font-bold text-tinta-suave hover:text-tinta flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Lista de Presentes</span>
          </Link>

          <span className="text-xs font-semibold text-sucesso bg-sucesso-suave border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sucesso" /> Checkout Criptografado
          </span>
        </div>

        {/* Formulario de Checkout */}
        <CheckoutClient gift={gift} coupleNames={coupleNames} />
      </div>

      <div className="text-center text-xs text-tinta-suave py-4 font-sans">
        {coupleNames} · Feito com Aceito
      </div>
    </div>
  );
}
