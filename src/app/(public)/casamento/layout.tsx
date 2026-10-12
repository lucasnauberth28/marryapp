import { ThemeLight } from "@/components/theme/theme-provider";

// O site do casal e as páginas do convidado ficam sempre claras: usam a cor e as fotos escolhidas
// pelos noivos e são pensadas como papelaria, então não seguem o tema escuro do painel.
export default function CasamentoLayout({ children }: { children: React.ReactNode }) {
  return <ThemeLight className="min-h-screen bg-linho text-tinta">{children}</ThemeLight>;
}
