import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDeGrafico, EsqueletoDoCabecalhoDaPagina, EsqueletoDaGradeDeIndicadores, EsqueletoDeTexto } from "@/components/skeletons";
import { EsqueletoDaAtencao, EsqueletoDasLinhas } from "@/components/plataforma/loading-parts";

/* Esqueletos de cada bloco da Visão geral (mesmas alturas dos blocos reais em page.tsx). */

export function EsqueletoDosNumeros() {
  return <EsqueletoDaGradeDeIndicadores count={4} />;
}

export function EsqueletoDoBlocoDeAtencao() {
  return (
    <EsqueletoDeCartao>
      <EsqueletoDaAtencao rows={3} />
    </EsqueletoDeCartao>
  );
}

export function EsqueletoDoBlocoDeReceita() {
  return (
    <EsqueletoDeCartao>
      <EsqueletoDeGrafico />
      <EsqueletoDeTexto lines={2} className="mt-4" />
    </EsqueletoDeCartao>
  );
}

export function EsqueletoDoBlocoDoFunil() {
  return (
    <EsqueletoDeCartao>
      <EsqueletoDeTexto lines={1} className="mb-5" lastLineWidth="w-2/3" />
      <ol className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="grid grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[180px_1fr_130px]">
            <Esqueleto className="h-4 w-32 rounded-md" />
            <Esqueleto className="h-3 rounded-full" />
            <div className="flex flex-col gap-1">
              <Esqueleto className="h-4 w-10 rounded-md" />
              <Esqueleto className="h-3 w-24 rounded-md" />
            </div>
          </li>
        ))}
      </ol>
    </EsqueletoDeCartao>
  );
}

export function EsqueletoDoBlocoDeProximos() {
  return (
    <EsqueletoDeCartao>
      <ul className="flex flex-col">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-4 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
            <div className="flex w-12 shrink-0 flex-col items-center gap-1">
              <Esqueleto className="h-3 w-8 rounded-md" />
              <Esqueleto className="h-6 w-8 rounded-md" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex h-6 items-center">
                <Esqueleto className="h-4 w-44 max-w-full rounded-md" />
              </div>
              <div className="flex h-6 items-center">
                <Esqueleto className="h-3 w-28 rounded-md" />
              </div>
            </div>
            <Esqueleto className="hidden h-7 w-24 rounded-lg sm:block" />
          </li>
        ))}
      </ul>
    </EsqueletoDeCartao>
  );
}

export function EsqueletoDoBlocoDeVencimentos() {
  return (
    <EsqueletoDeCartao>
      <EsqueletoDasLinhas rows={3} />
    </EsqueletoDeCartao>
  );
}

export function EsqueletoDoBlocoDeErros() {
  return (
    <EsqueletoDeCartao>
      <EsqueletoDasLinhas rows={4} />
    </EsqueletoDeCartao>
  );
}

/** Página inteira (loading.tsx e fallback enquanto se confere se já existe algum casamento). */
export function EsqueletoDaVisaoGeral() {
  return (
    <RegiaoDeCarregamento label="a visão geral" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina actions={1} />
      <EsqueletoDosNumeros />
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <EsqueletoDoBlocoDeAtencao />
        <EsqueletoDoBlocoDeReceita />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <EsqueletoDoBlocoDoFunil />
        <EsqueletoDoBlocoDeProximos />
      </div>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <EsqueletoDoBlocoDeVencimentos />
        <EsqueletoDoBlocoDeErros />
      </div>
    </RegiaoDeCarregamento>
  );
}
