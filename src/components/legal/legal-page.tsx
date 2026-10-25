import type { ReactNode } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { RodapeDaLanding } from "@/components/landing/landing-footer";
import { CabecalhoDaLanding } from "@/components/landing/landing-header";
import { estiloDoContainerDaLanding } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

export interface SecaoLegal {
  id: string;
  title: string;
  body: ReactNode;
}

/**
 * Página de documento legal (termos, privacidade): cabeçalho e rodapé da landing,
 * aviso de versão preliminar, sumário e seções numeradas.
 */
export function PaginaLegal({
  title,
  intro,
  updatedAt,
  sections,
  related,
}: {
  title: string;
  intro: ReactNode;
  updatedAt: ReactNode;
  sections: SecaoLegal[];
  related: { href: string; label: string };
}) {
  return (
    <div className="min-h-dvh bg-linho text-tinta">
      <CabecalhoDaLanding />

      <div role="note" className="border-b border-aviso/25 bg-aviso-suave">
        <p className={cn(estiloDoContainerDaLanding, "flex items-center gap-2.5 py-3 text-sm font-semibold leading-5 text-aviso")}>
          <TriangleAlert aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={2} />
          Versão preliminar — revisar com assessoria jurídica antes de publicar.
        </p>
      </div>

      <main id="conteudo" className={cn(estiloDoContainerDaLanding, "grid gap-10 pb-20 pt-10 md:pt-16 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16")}>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav aria-label="Sumário" className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Sumário</p>
            <ol className="flex flex-col gap-0.5 text-[15px]">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="inline-flex min-h-9 items-center text-tinta-suave transition-colors hover:text-ameixa">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="max-w-[720px]">
          <header className="flex flex-col gap-3 border-b border-linha pb-8">
            <h1 className="font-display text-[40px] leading-[46px] tracking-[-0.015em] text-balance lg:text-[52px] lg:leading-[58px]">{title}</h1>
            <p className="text-sm text-tinta-suave">Última atualização: {updatedAt}</p>
            <div className="text-[17px] leading-[28px] text-tinta-suave">{intro}</div>
          </header>

          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-titulo`} className="scroll-mt-28 border-b border-linha py-8 last:border-b-0">
              <h2 id={`${s.id}-titulo`} className="mb-4 font-display text-[28px] leading-9 text-tinta">
                {i + 1}. {s.title}
              </h2>
              <div className="flex flex-col gap-4 text-base leading-[26px] text-tinta [&_a]:font-semibold [&_a]:text-ameixa [&_a]:underline [&_a]:decoration-ameixa/30 [&_a]:underline-offset-4 [&_li]:pl-1 [&_strong]:font-semibold [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-6">
                {s.body}
              </div>
            </section>
          ))}

          <p className="mt-8 text-[15px] text-tinta-suave">
            Veja também: <Link href={related.href} className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4">{related.label}</Link>.
          </p>
        </article>
      </main>

      <RodapeDaLanding />
    </div>
  );
}
