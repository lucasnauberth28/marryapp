import { Esqueleto } from "@/components/ui/skeleton";
import { EsqueletoDeCartao, EsqueletoDeGrafico, EsqueletoDeFormulario, EsqueletoDaGradeDeIndicadores, EsqueletoDeTabela } from "@/components/skeletons";
import { EsqueletoDaAtencao, EsqueletoDoPainelDeTabela } from "@/components/plataforma/loading-parts";

/* Esqueletos das telas de Planos e receita. */

const DIVISAO = "grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]";

/** Aba Resumo. */
export function EsqueletoDoResumo() {
  return (
    <>
      <EsqueletoDaGradeDeIndicadores count={4} />
      <div className={DIVISAO}>
        <EsqueletoDeCartao>
          <EsqueletoDeGrafico />
        </EsqueletoDeCartao>
        <EsqueletoDeCartao>
          <EsqueletoDaAtencao rows={2} />
        </EsqueletoDeCartao>
      </div>
      <div className={DIVISAO}>
        <EsqueletoDoPainelDeTabela columns={5} rows={3} />
        <EsqueletoDoPainelDeTabela columns={4} rows={3} />
      </div>
      <EsqueletoDoPainelDeTabela columns={5} rows={3} />
    </>
  );
}

/** Aba Contador (e o fim do Catálogo): exportar e notas pendentes. */
export function EsqueletoDoContador() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <EsqueletoDeCartao>
        <EsqueletoDeFormulario fields={1} />
      </EsqueletoDeCartao>
      <EsqueletoDoPainelDeTabela columns={4} rows={3} />
    </div>
  );
}

/** Aba Reembolsos. */
export function EsqueletoDosReembolsos() {
  return (
    <>
      <EsqueletoDoPainelDeTabela columns={5} rows={3} />
      <EsqueletoDeCartao>
        <EsqueletoDeFormulario fields={["input", "input", "textarea"]} columns={2} />
      </EsqueletoDeCartao>
    </>
  );
}

/** Lista de pagamentos (Assinaturas e Pix) com os chips de filtro. */
export function EsqueletoDaListaDeAssinaturas() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {[24, 28, 20, 28, 28].map((w, i) => (
          <Esqueleto key={i} className="h-11 rounded-xl" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      <EsqueletoDeTabela columns={6} rows={8} mobileFields={4} />
    </div>
  );
}
