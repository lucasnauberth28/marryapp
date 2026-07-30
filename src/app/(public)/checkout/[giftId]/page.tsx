import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CheckoutClient } from "./checkout-client";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Checkout Seguro de Presente | Lucas & Giovanna",
  description: "Presenteie Lucas e Giovanna de forma rápida e segura",
};

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

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between py-8 px-4 sm:px-6 w-full animate-in fade-in duration-300 font-sans">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Top Header Imersivo sem Nav Links */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
          <Link
            href="/presentes"
            className="text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Lista de Presentes</span>
          </Link>

          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Checkout Criptografado
          </span>
        </div>

        {/* Formulario de Checkout */}
        <CheckoutClient gift={gift} />
      </div>

      <div className="text-center text-xs text-zinc-400 py-4 font-sans">
        Lucas & Giovanna © 2026 — Presenteie com Amor ❤️
      </div>
    </div>
  );
}
