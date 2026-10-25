import Link from "next/link";
import { Download, Heart, Search } from "lucide-react";
import { BotaoDeExportar } from "@/components/plataforma/export-button";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { estiloDoBotao } from "@/components/landing/styles";
import { montarLink } from "@/lib/platform/list-params";

export function BotaoDeExportarCasais({ habilitado, href }: { habilitado: boolean; href: string }) {
  if (habilitado) {
    return (
      <BotaoDeExportar href={href} fallbackName="casais.csv" className="gap-2">
        <Download className="size-4" aria-hidden="true" /> Exportar CSV
      </BotaoDeExportar>
    );
  }
  return (
    <span aria-disabled="true" className={`${estiloDoBotao.secondary} gap-2 opacity-50`}>
      <Download className="size-4" aria-hidden="true" /> Exportar CSV
    </span>
  );
}

export function SemNenhumCasamento() {
  return (
    <div className="rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]">
      <EstadoVazio
        icon={Heart}
        title="Ainda não tem ninguém aqui"
        action={
          <Link href="/cadastro" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
            Ver a página de cadastro
          </Link>
        }
      >
        Quando um casal criar o casamento, ele aparece nesta lista com plano, convidados e última atividade.
      </EstadoVazio>
    </div>
  );
}

export function SemCasalNosFiltros({ tab }: { tab: string }) {
  return (
    <div className="rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]">
      <EstadoVazio
        icon={Search}
        title="Nenhum casal com esses filtros"
        action={
          <Link href={montarLink("/admin/casais", { aba: tab === "todos" ? undefined : tab })} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
            Limpar filtros
          </Link>
        }
      >
        Tente tirar um filtro ou buscar por outro nome, e-mail ou endereço do site.
      </EstadoVazio>
    </div>
  );
}
