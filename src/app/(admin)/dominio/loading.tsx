import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDeFormulario, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";

// Espelha o domínio próprio: cabeçalho e os três blocos do pedido (endereço, titular e condições).
export default function LoadingDominio() {
  return (
    <RegiaoDeCarregamento label="o domínio próprio" className="flex max-w-[880px] flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina />

      <EsqueletoDeCartao description className="flex flex-col gap-4">
        <EsqueletoDeFormulario fields={1} submit={false} />
        <div className="flex flex-wrap gap-2">
          {[44, 36, 40].map((w, i) => (
            <Esqueleto key={i} className="h-11 rounded-xl" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
      </EsqueletoDeCartao>

      <EsqueletoDeCartao description>
        <EsqueletoDeFormulario fields={4} columns={2} submit={false} />
      </EsqueletoDeCartao>

      <EsqueletoDeCartao>
        <Esqueleto className="h-24 w-full rounded-xl" />
        <div className="mt-4 flex items-center gap-3">
          <Esqueleto className="size-5 rounded-md" />
          <Esqueleto className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <div className="mt-4 flex justify-end">
          <Esqueleto className="h-12 w-44 rounded-xl max-sm:w-full" />
        </div>
      </EsqueletoDeCartao>
    </RegiaoDeCarregamento>
  );
}
