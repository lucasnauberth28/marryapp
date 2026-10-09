import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getIdentityForWedding } from "@/lib/wedding";
import { weddingSitePath } from "@/lib/wedding-links";
import { notFound } from "next/navigation";
import { CheckoutClient } from "./checkout-client";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

/** O casamento vem sempre do presente. */
async function loadGift(giftId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(giftId)) return null;
  return prisma.gift.findUnique({
    where: { id: giftId },
    select: {
      id: true,
      title: true,
      description: true,
      amount: true,
      imageUrl: true,
      isPurchased: true,
      createdAt: true,
      wedding: {
        select: { id: true, slug: true, coupleNames: true, weddingDate: true, city: true, themeColor: true, onboardedAt: true },
      },
    },
  });
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { giftId } = await params;
  const gift = await loadGift(giftId);
  const { coupleNames } = await getIdentityForWedding(gift?.wedding ?? null);
  return {
    title: { absolute: `Presentear · ${coupleNames}` },
    description: "Pagamento seguro por Pix ou cartão.",
  };
}

interface CheckoutPageProps {
  params: Promise<{
    giftId: string;
  }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const resolvedParams = await params;
  const giftId = resolvedParams.giftId;

  const giftWithWedding = await loadGift(giftId);

  if (!giftWithWedding) {
    notFound();
  }

  // Só os campos do presente vão para o cliente
  const { wedding, ...gift } = giftWithWedding;
  const { coupleNames } = await getIdentityForWedding(wedding);
  const giftsPath = weddingSitePath(wedding.slug, "presentes");

  return (
    <div className="min-h-screen bg-linho flex flex-col justify-between py-8 px-4 sm:px-6 w-full animate-in fade-in duration-300 font-sans">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Top Header Imersivo sem Nav Links */}
        <div className="flex items-center justify-between pb-2 border-b border-linha/60">
          <Link
            href={giftsPath}
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
        <CheckoutClient gift={gift} coupleNames={coupleNames} slug={wedding.slug} />
      </div>

      <div className="text-center text-xs text-tinta-suave py-4 font-sans">
        {coupleNames} · Feito com Aceito
      </div>
    </div>
  );
}
