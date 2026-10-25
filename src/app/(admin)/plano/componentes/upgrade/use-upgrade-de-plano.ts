// A escolha do novo plano, o cupom conferido e o pagamento por Pix.
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { CupomAplicado } from "@/components/checkout/coupon-field";
import type { OpcaoDePlano } from "@/app/login/auth-config";

export function useUpgradeDePlano(plans: OpcaoDePlano[]) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(plans[0]?.id ?? "");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paidPlan, setPaidPlan] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<CupomAplicado | null>(null);

  // Depois de um pagamento a lista muda (router.refresh); se o plano escolhido sumir, volta ao primeiro.
  const plan = plans.find((p) => p.id === selected) ?? plans[0];
  // Só usa o cupom se ele foi conferido para o plano escolhido.
  const couponFor = coupon && plan && coupon.planId === plan.id ? coupon.code : null;

  const handlePaid = useCallback(() => {
    setPaidPlan(plan?.name ?? "");
    setCheckoutOpen(false);
    setCoupon(null);
    router.refresh();
  }, [plan?.name, router]);

  const abrirCheckout = () => {
    setPaidPlan(null);
    setCheckoutOpen(true);
  };

  return { plan, setSelected, checkoutOpen, setCheckoutOpen, paidPlan, coupon, setCoupon, couponFor, handlePaid, abrirCheckout };
}
