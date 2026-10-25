import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDeImagem, EsqueletoDeLista, EsqueletoDoCabecalhoDaPagina, EsqueletoDeIndicador } from "@/components/skeletons";
import { EsqueletoDoPainel, EsqueletoDoTituloDaSecao } from "@/components/painel/skeleton-parts";

// Espelha os presentes: cabeçalho, três números, a lista de recebidos e a vitrine de cartões com foto.
export default function LoadingPresentesAdmin() {
  return (
    <RegiaoDeCarregamento label="os presentes" className="flex w-full flex-1 flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina actions={2} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <EsqueletoDeIndicador className="p-5 sm:p-6" />
        <EsqueletoDeIndicador className="p-5 sm:p-6" />
        <EsqueletoDeIndicador className="p-5 sm:p-6" />
      </div>

      <EsqueletoDeCartao padded={false} className="overflow-hidden">
        <EsqueletoDeLista card={false} rows={4} leading="none" trailing="chip" lines={2} />
      </EsqueletoDeCartao>

      <section className="flex flex-col gap-3">
        <EsqueletoDoTituloDaSecao />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <EsqueletoDoPainel className="flex flex-col gap-2 p-3">
                <EsqueletoDeImagem ratio={1} className="rounded-xl" />
                <Esqueleto className="h-4 w-3/4 rounded-md" />
                <Esqueleto className="h-3.5 w-1/2 rounded-md" />
              </EsqueletoDoPainel>
            </li>
          ))}
        </ul>
      </section>
    </RegiaoDeCarregamento>
  );
}
