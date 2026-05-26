import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout de Presente | Lucas & Giovanna",
  description: "Escolha a melhor forma de presentear Lucas e Giovanna",
};

interface CheckoutPageProps {
  params: {
    giftId: string;
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  // O Params pode vir como Promise no Next.js 15/16
  const resolvedParams = await params;
  const giftId = resolvedParams.giftId;

  const gift = await prisma.gift.findUnique({
    where: { id: giftId },
  });

  if (!gift) {
    notFound();
  }

  return (
    <div className="flex-1 py-12 px-6 w-full max-w-2xl mx-auto animate-in fade-in duration-500">
      <CheckoutClient gift={gift} />
    </div>
  );
}
