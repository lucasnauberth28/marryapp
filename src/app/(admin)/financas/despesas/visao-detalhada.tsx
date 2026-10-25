// Visão detalhada: tabela completa com busca, ordenação e 15 itens por página.
import { Building2, ExternalLink, ShoppingBag, Trash2 } from "lucide-react";
import { Etiqueta } from "@/components/casal/ui";
import { Botao } from "@/components/ui/button";
import { TabelaDeDados } from "@/components/ui/data-table";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { BotaoDeSituacao } from "./parcelas-do-grupo";
import type { ItemDeDespesa } from "./tipos";
import type { AcoesDasDespesas } from "./use-acoes-das-despesas";

const quitada = (e: ItemDeDespesa) => e.status === "PAID";
const dataEmPortugues = (e: ItemDeDespesa) => new Date(e.dueDate).toLocaleDateString("pt-BR");

function CelulaDoTipo({ despesa }: { despesa: ItemDeDespesa }) {
  const compra = (despesa.type || "CONTRACT") === "PURCHASE";
  return <Etiqueta tone={compra ? "salvia" : "neutro"} icon={compra ? ShoppingBag : Building2}>{compra ? "Compra" : "Contrato"}</Etiqueta>;
}

function CelulaDaOrigem({ despesa }: { despesa: ItemDeDespesa }) {
  return (
    <div className="flex items-center gap-2">
      {despesa.imageUrl && (
        <span className="relative block size-7 shrink-0 overflow-hidden rounded-md border border-linha">
          <ImagemDaPessoa src={despesa.imageUrl} alt={despesa.description} sizes="28px" className="object-cover" />
        </span>
      )}
      <span className={`text-sm font-medium ${quitada(despesa) ? "text-tinta-suave" : "text-tinta"}`}>{despesa.vendor?.name || despesa.storeName || "Compra direta"}</span>
    </div>
  );
}

function CelulaDaDescricao({ despesa }: { despesa: ItemDeDespesa }) {
  return (
    <div className="space-y-0.5">
      <span className={`text-sm block ${quitada(despesa) ? "text-tinta-suave line-through" : "text-tinta"}`}>{despesa.description}</span>
      {despesa.purchaseUrl && (
        <a href={despesa.purchaseUrl} target="_blank" rel="noreferrer" className="text-xs text-salvia hover:underline inline-flex items-center gap-1 font-medium">
          <ExternalLink className="w-3 h-3" /> Ver link da compra
        </a>
      )}
    </div>
  );
}

function colunasDaTabela(acoes: AcoesDasDespesas) {
  return [
    { key: "dueDate", header: "Vencimento", sortable: true, accessor: (e: ItemDeDespesa) => new Date(e.dueDate).getTime(), cell: (e: ItemDeDespesa) => <span className={quitada(e) ? "text-tinta-suave text-sm font-mono" : "text-tinta text-sm font-mono font-medium"}>{dataEmPortugues(e)}</span> },
    { key: "type", header: "Tipo", sortable: true, accessor: (e: ItemDeDespesa) => e.type || "CONTRACT", cell: (e: ItemDeDespesa) => <CelulaDoTipo despesa={e} /> },
    { key: "vendor", header: "Origem ou fornecedor", sortable: true, accessor: (e: ItemDeDespesa) => e.vendor?.name || e.storeName || "", cell: (e: ItemDeDespesa) => <CelulaDaOrigem despesa={e} /> },
    { key: "description", header: "Descrição", sortable: true, accessor: (e: ItemDeDespesa) => e.description, cell: (e: ItemDeDespesa) => <CelulaDaDescricao despesa={e} /> },
    { key: "amount", header: "Valor", sortable: true, className: "tabular-nums", accessor: (e: ItemDeDespesa) => e.amount, cell: (e: ItemDeDespesa) => <span className={`text-sm font-bold ${quitada(e) ? "text-tinta-suave" : "text-tinta"}`}>{formatarReais(e.amount)}</span> },
    { key: "status", header: "Status", sortable: true, accessor: (e: ItemDeDespesa) => e.status, cell: (e: ItemDeDespesa) => <BotaoDeSituacao despesa={e} acoes={acoes} /> },
    { key: "actions", header: "Ações", sortable: false, searchable: false, className: "text-right pr-4", headerClassName: "text-right pr-4", cell: (e: ItemDeDespesa) => (
      <div className="flex justify-end gap-1">
        <Botao aria-label="Excluir" variant="ghost" size="icon" onClick={() => acoes.pedirExclusao(e.id)}><Trash2 className="w-4 h-4 text-perigo" /></Botao>
      </div>
    ) },
  ];
}

export function VisaoDetalhada({ despesas, acoes }: { despesas: ItemDeDespesa[]; acoes: AcoesDasDespesas }) {
  return (
    <TabelaDeDados
      data={despesas}
      pageSize={15}
      keyExtractor={(e) => e.id}
      searchPlaceholder="Buscar por descrição ou loja..."
      emptyMessage="Nenhuma despesa cadastrada para este filtro."
      columns={colunasDaTabela(acoes)}
    />
  );
}
