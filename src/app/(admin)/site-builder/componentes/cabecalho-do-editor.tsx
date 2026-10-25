import Link from "next/link";
import { ArrowLeft, Check, Eye } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { caminhoDoSiteDoCasamento } from "@/lib/casamento/wedding-links";
import { rotuloDaPublicacao } from "./utilitarios";
import type { EditorDoSite } from "./use-configuracoes-do-site";

export function CabecalhoDoEditor({ slug, endereco, site, ocupado }: { slug: string; endereco: string; site: EditorDoSite; ocupado: boolean }) {
  const { alterado, publicadoEm, publicando, publicar } = site;
  return (
    <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-linha bg-papel px-4 py-3 shadow-[var(--shadow-aceito-1)]">
      <Link href="/dashboard" aria-label="Voltar ao painel" className="grid size-11 shrink-0 place-items-center rounded-xl text-tinta hover:bg-ameixa-suave">
        <ArrowLeft className="size-5" aria-hidden="true" />
      </Link>
      <div className="flex min-w-0 flex-1 basis-48 flex-col">
        <h1 className="font-semibold text-tinta">Editar o site</h1>
        <span className="truncate text-sm text-tinta-suave" aria-live="polite">
          {endereco} · {rotuloDaPublicacao(alterado, publicadoEm)}
        </span>
      </div>
      <Link href={caminhoDoSiteDoCasamento(slug)} target="_blank" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
        <Eye className="size-4" aria-hidden="true" /> Ver o site
      </Link>
      <BotaoComCarregamento onClick={publicar} loading={publicando} disabled={ocupado || !alterado} className={`${estiloDoBotao.primary} ${estiloDoBotao.sm}`}>
        {alterado ? null : <Check className="size-4" aria-hidden="true" />}
        {alterado ? "Publicar alterações" : "Tudo publicado"}
      </BotaoComCarregamento>
    </header>
  );
}
