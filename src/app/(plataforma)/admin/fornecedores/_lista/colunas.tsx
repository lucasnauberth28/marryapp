import { Star } from "lucide-react";
import { EtiquetaDePlano, EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarData, diaRelativo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import type { LinhaDeFornecedorDoAdmin } from "@/lib/platform/queries/fornecedores";
import { ROTULO_DA_CURADORIA, visaoDaCuradoria, tomDoVencimentoDoPlano } from "@/lib/platform/vendor-admin";
import { ETIQUETA_DA_VISAO } from "./etiquetas";

type Fornecedor = LinhaDeFornecedorDoAdmin;

function CelulaDaCuradoria({ v }: { v: Fornecedor }) {
  const view = visaoDaCuradoria(v);
  const chip = ETIQUETA_DA_VISAO[view];
  return (
    <EtiquetaDeSituacao tone={chip.tone} icon={chip.icon}>
      {ROTULO_DA_CURADORIA[view]}
    </EtiquetaDeSituacao>
  );
}

function CelulaDeVisitas({ v }: { v: Fornecedor }) {
  if (v.visits === 0 && v.leads === 0) return <span className="text-tinta-suave">Sem dados</span>;
  return (
    <>
      <span className="block">{pluralizar(v.visits, "visita", "visitas")}</span>
      <span className="block text-sm text-tinta-suave">{pluralizar(v.leads, "pedido", "pedidos")}</span>
    </>
  );
}

function CelulaDaNota({ v }: { v: Fornecedor }) {
  if (v.reviewCount === 0) return <span className="text-tinta-suave">Sem nota</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="size-4 fill-champanhe text-champanhe" aria-hidden="true" />
      {v.rating.toFixed(1).replace(".", ",")} ({v.reviewCount})
    </span>
  );
}

function CelulaDoVencimento({ v, now }: { v: Fornecedor; now: Date }) {
  if (v.planTier === "FREE") return <span className="text-tinta-suave">Sem plano pago</span>;
  if (!v.planExpiresAt) return <span className="text-tinta-suave">Sem vencimento</span>;
  const logo = tomDoVencimentoDoPlano(v.planExpiresAt, now) === "soon";
  return (
    <>
      <span className="block">{formatarData(v.planExpiresAt)}</span>
      <span className={logo ? "block text-sm font-semibold text-aviso" : "block text-sm text-tinta-suave"}>{diaRelativo(v.planExpiresAt, now)}</span>
    </>
  );
}

export function colunasDosFornecedores(now: Date) {
  return [
    {
      key: "nome",
      header: "Fornecedor",
      primary: true,
      cell: (v: Fornecedor) => (
        <>
          <span className="block">{v.companyName}</span>
          <span className="block text-sm font-normal text-tinta-suave">
            {v.category}
            {v.city ? ` · ${v.city}` : ""}
          </span>
        </>
      ),
    },
    { key: "plano", header: "Plano", cell: (v: Fornecedor) => <EtiquetaDePlano plan={v.planTier} /> },
    { key: "curadoria", header: "Curadoria", cell: (v: Fornecedor) => <CelulaDaCuradoria v={v} /> },
    { key: "visitas", header: "Visitas e pedidos", mobileLabel: "Visitas e pedidos", cell: (v: Fornecedor) => <CelulaDeVisitas v={v} /> },
    { key: "nota", header: "Nota", cell: (v: Fornecedor) => <CelulaDaNota v={v} /> },
    { key: "vence", header: "Plano vence", mobileLabel: "Plano vence", cell: (v: Fornecedor) => <CelulaDoVencimento v={v} now={now} /> },
  ];
}
