import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDeLista, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { EsqueletoDoPainel } from "@/components/painel/skeleton-parts";

// Espelha os avisos: cabeçalho com atalho, cartão de avisos no aparelho e o histórico (barra e linhas).
export default function NotificacoesLoading() {
  return (
    <RegiaoDeCarregamento label="os avisos" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina actions={1} />

      <EsqueletoDoPainel className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <Esqueleto className="size-11 shrink-0 rounded-xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
            <Esqueleto className="h-4 w-44 rounded-md" />
            <Esqueleto className="h-4 w-full max-w-md rounded-md" />
          </div>
        </div>
        <Esqueleto className="h-11 w-60 rounded-xl" />
      </EsqueletoDoPainel>

      <EsqueletoDoPainel className="overflow-hidden">
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-linha pl-4 pr-2">
          <Esqueleto className="h-4 w-24 rounded-md" />
          <Esqueleto className="h-9 w-48 rounded-lg" />
        </div>
        <EsqueletoDeLista card={false} rows={6} leading="icon" lines={2} />
      </EsqueletoDoPainel>
    </RegiaoDeCarregamento>
  );
}
