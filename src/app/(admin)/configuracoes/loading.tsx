import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";

// Espelha as configurações: cabeçalho sem descrição e cartões (casamento, prazo, WhatsApp, acesso, plano).
export default function ConfiguracoesLoading() {
  return (
    <RegiaoDeCarregamento label="as configurações" className="flex max-w-[880px] flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina description={false} />

      <EsqueletoDeCartao description className="py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <Esqueleto className="h-3.5 w-24 rounded-md" />
              <Esqueleto className="h-5 w-40 max-w-full rounded-md" />
            </div>
          ))}
        </div>
        <Esqueleto className="mt-5 h-11 w-52 rounded-xl" />
      </EsqueletoDeCartao>

      <EsqueletoDeCartao>
        <Esqueleto className="h-12 w-full rounded-xl sm:max-w-[320px]" />
        <Esqueleto className="mt-4 h-11 w-32 rounded-xl" />
      </EsqueletoDeCartao>

      <EsqueletoDeCartao description>
        <Esqueleto className="h-11 w-44 rounded-xl" />
      </EsqueletoDeCartao>
      <EsqueletoDeCartao description>
        <Esqueleto className="h-11 w-44 rounded-xl" />
      </EsqueletoDeCartao>
    </RegiaoDeCarregamento>
  );
}
