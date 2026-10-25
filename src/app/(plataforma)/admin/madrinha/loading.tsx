import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDeFormulario, EsqueletoDoCabecalhoDaPagina, EsqueletoDaGradeDeIndicadores } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";
import { EsqueletoDasLinhas } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="a Liz" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina actions={1} />
      <Esqueleto className="h-20 rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <EsqueletoDeCartao>
          <EsqueletoDasLinhas rows={5} chip={false} />
        </EsqueletoDeCartao>
        <EsqueletoDeCartao>
          <EsqueletoDaGradeDeIndicadores count={3} cols={3} className="lg:grid-cols-3" />
        </EsqueletoDeCartao>
      </div>
      <EsqueletoDeCartao />
      <section className="flex flex-col gap-4">
        <Esqueleto className="h-7 w-48 rounded-md" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EsqueletoDeCartao>
            <EsqueletoDeFormulario fields={4} columns={2} submit={false} />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao>
            <EsqueletoDeFormulario fields={4} columns={2} submit={false} />
          </EsqueletoDeCartao>
        </div>
        <Esqueleto className="h-11 w-36 rounded-xl" />
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <EsqueletoDeCartao key={i}>
            <EsqueletoDeFormulario fields={3} />
          </EsqueletoDeCartao>
        ))}
      </div>
      <EsqueletoDeCartao>
        <EsqueletoDasLinhas rows={2} />
      </EsqueletoDeCartao>
    </RegiaoDeCarregamento>
  );
}
