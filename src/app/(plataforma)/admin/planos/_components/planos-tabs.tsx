import { TabsNav } from "@/components/plataforma/tabs-nav";
import { getPixToCheck, getPendingRefunds } from "@/lib/platform/queries/receita";

export type PlanosTab = "resumo" | "assinaturas" | "cupons" | "reembolsos" | "catalogo" | "contador";

/** Abas de Planos e receita, as mesmas em todas as telas dessa área (cada aba é uma rota ou um ?aba=). */
export async function PlanosTabs({ active }: { active: PlanosTab }) {
  const [pix, refunds] = await Promise.all([getPixToCheck(), getPendingRefunds()]);
  return (
    <TabsNav
      label="Planos e receita"
      basePath="/admin/planos"
      active={active}
      tabs={[
        { value: "resumo", label: "Resumo", href: "/admin/planos" },
        { value: "assinaturas", label: "Assinaturas e Pix", count: pix.count, href: "/admin/planos/assinaturas" },
        { value: "cupons", label: "Cupons", href: "/admin/planos/cupons" },
        { value: "reembolsos", label: "Reembolsos", count: refunds.count, href: "/admin/planos?aba=reembolsos" },
        { value: "catalogo", label: "Catálogo e preços", href: "/admin/planos/catalogo" },
        { value: "contador", label: "Contador", href: "/admin/planos?aba=contador" },
      ]}
    />
  );
}
