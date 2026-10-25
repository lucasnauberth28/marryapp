import { Pencil } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import { LinkPendente } from "@/components/plataforma/pending";
import type { obterCatalogo } from "@/lib/pagamento/catalog-server";
import { textoDoDescontoDoCombo, ehPlanoGratis, chaveDoModuloNoCatalogo, chaveDoPlanoNoCatalogo } from "@/lib/pagamento/catalog";
import { CONFIGURACAO_DOS_PLANOS, type ChaveDoPlano } from "@/lib/pagamento/plans";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { ORDEM_DOS_PLANOS } from "./edicao";

type Catalogo = Awaited<ReturnType<typeof obterCatalogo>>;

const TAXA_DO_PRESENTE: Partial<Record<ChaveDoPlano, string>> = { basic: "3,99%", classic: "0% no Pix", vip: "0% no Pix" };
const COBRANCA = (id: ChaveDoPlano) => (ehPlanoGratis(id) ? "Grátis" : CONFIGURACAO_DOS_PLANOS[id].type === "VENDOR" ? "Por mês" : "Pagamento único");
const LINK_DE_EDICAO = "inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-ameixa-suave";

const EtiquetaEditado = () => (
  <span className="ml-2 align-middle">
    <EtiquetaDeSituacao tone="ameixa">Editado</EtiquetaDeSituacao>
  </span>
);

function LinkDeEdicao({ chave, rotulo }: { chave: string; rotulo: string }) {
  return (
    <LinkPendente href={`/admin/planos/catalogo?editar=${chave}#editar`} scroll={false} className={LINK_DE_EDICAO}>
      <Pencil className="size-4" aria-hidden="true" /> Editar<span className="sr-only"> {rotulo}</span>
    </LinkPendente>
  );
}

export function PainelDePlanos({ catalog, edited, editing }: { catalog: Catalogo; edited: Set<string>; editing: string | undefined }) {
  return (
    <Painel title="Planos" padded={false}>
      <div className="px-3 pb-3 md:px-4 md:pb-4">
        <TabelaResponsiva
          caption="Planos à venda"
          rows={ORDEM_DOS_PLANOS}
          rowKey={(id) => id}
          selectedKey={editing?.startsWith("plan:") ? editing.slice(5) : null}
          columns={[
            { key: "plano", header: "Plano", primary: true, cell: (id) => <>{catalog.plans[id].name.replace(/^(Plano|Fornecedor)\s+/, "")}{edited.has(chaveDoPlanoNoCatalogo(id)) ? <EtiquetaEditado /> : null}</> },
            { key: "para", header: "Para quem", cell: (id) => (catalog.plans[id].type === "VENDOR" ? "Fornecedor" : "Casal") },
            { key: "preco", header: "Preço", align: "right", className: "whitespace-nowrap", cell: (id) => formatarReais(catalog.plans[id].price) },
            { key: "cobranca", header: "Cobrança", cell: (id) => COBRANCA(id) },
            { key: "taxa", header: "Taxa nos presentes", mobileLabel: "Taxa nos presentes", cell: (id) => TAXA_DO_PRESENTE[id] ?? <span className="text-tinta-suave">Não se aplica</span> },
            { key: "editar", header: <span className="sr-only">Editar</span>, mobileLabel: false, cell: (id) => <LinkDeEdicao chave={chaveDoPlanoNoCatalogo(id)} rotulo={`o plano ${catalog.plans[id].name}`} /> },
          ]}
        />
        <p className="mt-3 text-sm text-tinta-suave">Plano Liz: ainda não está à venda, então não tem preço para editar. A taxa dos presentes vem do Mercado Pago e aparece aqui só como informação.</p>
      </div>
    </Painel>
  );
}

export function PainelDeModulos({ catalog, edited, editing }: { catalog: Catalogo; edited: Set<string>; editing: string | undefined }) {
  return (
    <Painel title="Módulos do plano adaptado" padded={false}>
      <div className="px-3 pb-3 md:px-4 md:pb-4">
        <TabelaResponsiva
          caption="Módulos do plano adaptado"
          rows={catalog.modules}
          rowKey={(m) => m.id}
          selectedKey={editing?.startsWith("module:") ? editing.slice(7) : null}
          columns={[
            { key: "nome", header: "Módulo", primary: true, cell: (m) => <>{m.category}: {m.name}{edited.has(chaveDoModuloNoCatalogo(m.id)) ? <EtiquetaEditado /> : null}</> },
            { key: "preco", header: "Preço", align: "right", className: "whitespace-nowrap", cell: (m) => formatarReais(m.price) },
            { key: "editar", header: <span className="sr-only">Editar</span>, mobileLabel: false, cell: (m) => <LinkDeEdicao chave={chaveDoModuloNoCatalogo(m.id)} rotulo={`o módulo ${m.name}`} /> },
          ]}
        />
        <p className="mt-3 text-sm text-tinta-suave">{textoDoDescontoDoCombo()}</p>
      </div>
    </Painel>
  );
}
