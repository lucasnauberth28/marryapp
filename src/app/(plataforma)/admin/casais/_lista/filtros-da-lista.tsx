import { NavegacaoDeAbas } from "@/components/plataforma/tabs-nav";
import { BarraDeFiltros } from "@/components/plataforma/filter-bar";

type ParametrosAtivos = Record<string, string | number | null | undefined>;

const FILTROS = [
  { key: "plano", label: "Plano", allLabel: "Todos", options: [{ value: "basic", label: "Básico" }, { value: "classic", label: "Classic" }, { value: "vip", label: "VIP" }, { value: "custom", label: "Adaptado" }] },
  { key: "data", label: "Data do casamento", allLabel: "Qualquer data", options: [{ value: "prox30", label: "Próximos 30 dias" }, { value: "prox90", label: "Próximos 90 dias" }, { value: "passados", label: "Já aconteceram" }, { value: "semdata", label: "Sem data" }] },
  { key: "onboarding", label: "Etapa do onboarding", allLabel: "Todas", options: [{ value: "concluido", label: "Concluído" }, { value: "pendente", label: "Pendente" }] },
  { key: "atividade", label: "Atividade recente", allLabel: "Qualquer", options: [{ value: "hoje", label: "Hoje" }, { value: "7d", label: "Últimos 7 dias" }, { value: "30d", label: "Últimos 30 dias" }, { value: "sem", label: "Sem atividade" }] },
  { key: "dominio", label: "Domínio próprio", allLabel: "Tanto faz", options: [{ value: "proprio", label: "No ar" }, { value: "pedido", label: "Pedido em andamento" }, { value: "nenhum", label: "Nenhum" }] },
  { key: "acompanhar", label: "Acompanhamento", allLabel: "Todos", options: [{ value: "marcados", label: "Marcados para acompanhar" }] },
  { key: "ordem", label: "Ordenar por", allLabel: "Mais recentes", options: [{ value: "data", label: "Data do casamento" }, { value: "atividade", label: "Atividade recente" }, { value: "nome", label: "Nome" }] },
];

interface Contagens {
  total: number;
  problema: number;
  proximos30: number;
  inativos: number;
  onboarding: number;
}

export function FiltrosDaListaDeCasais({ tab, active, counts }: { tab: string; active: ParametrosAtivos; counts: Contagens }) {
  return (
    <>
      <NavegacaoDeAbas
        label="Grupos de casais"
        basePath="/admin/casais"
        params={active}
        active={tab}
        tabs={[
          { value: "todos", label: "Todos", count: counts.total },
          { value: "problema", label: "Com problema", count: counts.problema },
          { value: "30dias", label: "Casamento em 30 dias", count: counts.proximos30 },
          { value: "inativos", label: "Sem atividade", count: counts.inativos },
          { value: "onboarding", label: "Onboarding incompleto", count: counts.onboarding },
        ]}
      />
      <BarraDeFiltros searchPlaceholder="Buscar por nome, e-mail ou endereço do site" filters={FILTROS} />
    </>
  );
}
