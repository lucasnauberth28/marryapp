import { Painel } from "@/components/plataforma/panel";

export const SECOES = [
  { id: "textos", label: "Textos legais" },
  { id: "presentes", label: "Presentes e taxas" },
  { id: "manutencao", label: "Manutenção" },
  { id: "planos", label: "Recursos por plano" },
  { id: "integracoes", label: "Integrações" },
  { id: "emails", label: "E-mails e remetentes" },
  { id: "reembolso", label: "Reembolso" },
  { id: "limites", label: "Limites de uso" },
] as const;

export function SecaoDaConfiguracao({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-6">
      <Painel title={title} description={description}>
        {children}
      </Painel>
    </div>
  );
}

export function IndiceDasSecoes() {
  return (
    <nav aria-label="Seções desta página" className="-mx-4 overflow-x-auto px-4 lg:sticky lg:top-6 lg:mx-0 lg:self-start lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {SECOES.map((s) => (
          <li key={s.id} className="shrink-0">
            <a href={`#${s.id}`} className="inline-flex min-h-11 items-center rounded-xl px-3 text-[15px] font-semibold text-tinta-suave hover:bg-areia hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa lg:w-full">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
