import { chaveDoModuloNoCatalogo } from "@/lib/pagamento/catalog";
import { ehPlanoGratis } from "@/lib/pagamento/catalog";
import type { obterCatalogo } from "@/lib/pagamento/catalog-server";
import { CONFIGURACAO_DOS_PLANOS, type ChaveDoPlano } from "@/lib/pagamento/plans";
import { MODULOS_DO_CASAL } from "@/lib/pagamento/pricing-modules";

export const ORDEM_DOS_PLANOS: ChaveDoPlano[] = ["basic", "classic", "vip", "start", "pro", "master"];

type Catalogo = Awaited<ReturnType<typeof obterCatalogo>>;

export interface ItemEmEdicao {
  key: string;
  title: string;
  name: string;
  price: number;
  free: boolean;
}

/** Item em edição (só aceita chaves que existem no catálogo). */
export function itemEmEdicao(editing: string | undefined, catalog: Catalogo): ItemEmEdicao | null {
  if (editing?.startsWith("plan:")) {
    const id = editing.slice(5) as ChaveDoPlano;
    if (!ORDEM_DOS_PLANOS.includes(id)) return null;
    const plano = catalog.plans[id];
    return { key: editing, title: `o plano ${plano.name.replace(/^(Plano|Fornecedor)\s+/, "")}`, name: plano.name, price: plano.price, free: ehPlanoGratis(id) };
  }
  if (editing?.startsWith("module:")) {
    const mod = catalog.modules.find((m) => chaveDoModuloNoCatalogo(m.id) === editing);
    if (mod) return { key: editing, title: "o recurso", name: mod.name, price: mod.price, free: false };
  }
  return null;
}

export function rotuloDoItem(key: string | null) {
  if (!key) return "Item";
  if (key.startsWith("plan:")) return CONFIGURACAO_DOS_PLANOS[key.slice(5) as ChaveDoPlano]?.name ?? key;
  return MODULOS_DO_CASAL.find((m) => chaveDoModuloNoCatalogo(m.id) === key)?.name ?? key;
}
