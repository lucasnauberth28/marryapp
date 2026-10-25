import { Suspense } from "react";
import { NavegacaoDeAbas } from "@/components/plataforma/tabs-nav";
import { obterPixParaConferir } from "@/lib/platform/queries/receita/resumo";
import { obterReembolsosPendentes } from "@/lib/platform/queries/receita/pendencias";

export type AbaDePlanos = "resumo" | "assinaturas" | "cupons" | "reembolsos" | "catalogo" | "contador";

function abasDeCadaPagina(counts: { pix?: number; refunds?: number }) {
  return [
    { value: "resumo", label: "Resumo", href: "/admin/planos" },
    { value: "assinaturas", label: "Assinaturas e Pix", count: counts.pix, href: "/admin/planos/assinaturas" },
    { value: "cupons", label: "Cupons", href: "/admin/planos/cupons" },
    { value: "reembolsos", label: "Reembolsos", count: counts.refunds, href: "/admin/planos?aba=reembolsos" },
    { value: "catalogo", label: "Catálogo e preços", href: "/admin/planos/catalogo" },
    { value: "contador", label: "Contador", href: "/admin/planos?aba=contador" },
  ];
}

async function AbasComContagem({ active }: { active: AbaDePlanos }) {
  const [pix, refunds] = await Promise.all([obterPixParaConferir(), obterReembolsosPendentes()]);
  return <NavegacaoDeAbas label="Planos e receita" basePath="/admin/planos" active={active} tabs={abasDeCadaPagina({ pix: pix.count, refunds: refunds.count })} />;
}

/**
 * Abas de Planos e receita, as mesmas em todas as telas dessa área (cada aba é uma rota ou um ?aba=).
 * Os números das abas vêm de consultas: enquanto não chegam, as abas já aparecem (sem número) e funcionam.
 */
export function AbasDePlanos({ active }: { active: AbaDePlanos }) {
  return (
    <Suspense fallback={<NavegacaoDeAbas label="Planos e receita" basePath="/admin/planos" active={active} tabs={abasDeCadaPagina({})} />}>
      <AbasComContagem active={active} />
    </Suspense>
  );
}
