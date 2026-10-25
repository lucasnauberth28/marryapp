import { Plus } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { obterCatalogo } from "@/lib/catalog-server";
import { cn } from "@/lib/utils";
import { perguntasFrequentes } from "./faq/perguntas";
import { estiloDoContainerDaLanding, estiloDoTituloDaSecao, estiloDoTextoDeApoio, estiloDoSobretituloDaLanding } from "./styles";

function CabecalhoDasDuvidas() {
  return (
    <Aparicao className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
      <p className={cn(estiloDoSobretituloDaLanding, "flex items-center gap-3")}>
        <span aria-hidden="true" className="h-px w-8 shrink-0 bg-rosa" />
        Dúvidas
      </p>
      <h2 id="duvidas-titulo" className={estiloDoTituloDaSecao}>
        Perguntas frequentes
      </h2>
      <p className={cn(estiloDoTextoDeApoio, "max-w-[40ch]")}>O essencial sobre planos, presentes, convidados e fornecedores.</p>
    </Aparicao>
  );
}

function PerguntaEmAcordeao({ faq, aberta }: { faq: ReturnType<typeof perguntasFrequentes>[number]; aberta: boolean }) {
  return (
    <details
      name="duvidas"
      open={aberta || undefined}
      className={cn(
        "group border-b border-linha [interpolate-size:allow-keywords]",
        "[&::details-content]:h-0 [&::details-content]:overflow-clip [&::details-content]:transition-[height,content-visibility] [&::details-content]:duration-500 [&::details-content]:ease-[var(--ease-aceito)] [&::details-content]:[transition-behavior:allow-discrete]",
        "open:[&::details-content]:h-auto",
      )}
    >
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-semibold leading-6 text-tinta transition-colors duration-200 hover:text-ameixa sm:text-lg [&::-webkit-details-marker]:hidden">
        {faq.q}
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-linha text-tinta-suave transition-[transform,background-color,border-color,color] duration-500 ease-[var(--ease-aceito)] group-open:rotate-45 group-open:border-ameixa group-open:bg-ameixa group-open:text-on-ameixa"
        >
          <Plus className="size-4" strokeWidth={2} />
        </span>
      </summary>
      <div className="max-w-[62ch] pb-6 pr-12 text-base leading-[26px] text-tinta-suave">{faq.a}</div>
    </details>
  );
}

/**
 * Perguntas frequentes em acordeão nativo (<details>), sem JavaScript.
 * Só uma aberta por vez (atributo name). Onde o navegador permite, a altura anima.
 */
export async function SecaoDePerguntasFrequentes() {
  const FAQS = perguntasFrequentes(await obterCatalogo());
  return (
    <section id="duvidas" aria-labelledby="duvidas-titulo" className="py-16 sm:py-24 lg:py-28">
      <div className={cn(estiloDoContainerDaLanding, "grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-20")}>
        <CabecalhoDasDuvidas />
        <div className="border-t border-linha">
          {FAQS.map((faq, i) => (
            <Aparicao key={faq.q} delay={i * 80}>
              <PerguntaEmAcordeao faq={faq} aberta={i === 0} />
            </Aparicao>
          ))}
        </div>
      </div>
    </section>
  );
}
