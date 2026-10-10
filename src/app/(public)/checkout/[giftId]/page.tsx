import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getIdentityForWedding } from "@/lib/wedding";
import { weddingSitePath } from "@/lib/wedding-links";
import { notFound } from "next/navigation";
import { CheckoutClient } from "./checkout-client";
import { isCardPaymentAvailable } from "@/lib/mercadopago";
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
    <div className="flex min-h-dvh flex-col bg-linho font-sans text-tinta">
      <header className="border-b border-linha">
        <div className="mx-auto flex h-[60px] max-w-[560px] items-center gap-1 px-2 sm:px-4">
          <Link
            href={giftsPath}
            aria-label="Voltar para a lista de presentes"
            className="grid size-11 shrink-0 place-items-center rounded-[12px] text-tinta transition-colors hover:bg-areia"
          >
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </Link>
          <span className="font-semibold">Presentear</span>
          <span className="ml-auto inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-sucesso-suave px-2.5 text-sm font-semibold text-sucesso">
            <ShieldCheck aria-hidden="true" className="size-4" strokeWidth={2} /> Pagamento seguro
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-4 pb-6 pt-5">
        <CheckoutClient gift={gift} coupleNames={coupleNames} slug={wedding.slug} cardEnabled={isCardPaymentAvailable()} />
      </div>

      <p className="px-4 pb-6 text-center text-sm text-tinta-suave">{coupleNames} · Feito com Aceito</p>
    </div>
  );
}
