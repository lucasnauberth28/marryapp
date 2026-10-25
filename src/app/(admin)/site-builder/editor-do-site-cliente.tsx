"use client";
// O editor do site do casal: seções que abrem, prévia ao vivo e publicação das alterações.
import { useState, useTransition, type ReactNode } from "react";
import type { ConfiguracoesDoSiteDoCasamento } from "@/components/public/site-do-casamento/tipos";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { urlDoSiteDoCasamento } from "@/lib/casamento/wedding-links";
import { CabecalhoDoEditor } from "./componentes/cabecalho-do-editor";
import { ConteudoDaSecao } from "./componentes/conteudo-da-secao";
import { LinhaDaSecao } from "./componentes/linha-da-secao";
import { PreviaDoSite } from "./componentes/previa-do-site";
import { SECOES, type Dica, type IdDaSecao, type ItemDaHistoria, type PresenteDaPrevia } from "./componentes/tipos";
import { useConfiguracoesDoSite, useEnvioDeFoto } from "./componentes/use-configuracoes-do-site";
import { useDicas, useExclusaoDeItem, useHistoria } from "./componentes/use-historia-e-dicas";

interface PropriedadesDoEditorDoSiteCliente {
  initialSettings: (ConfiguracoesDoSiteDoCasamento & { id?: string }) | null;
  initialStoryItems: ItemDaHistoria[];
  initialTips: Dica[];
  previewGifts: PresenteDaPrevia[];
  rsvpDeadline: Date | string | null;
  /** Endereço público do casamento (/casamento/<slug>) */
  slug: string;
  /** Domínio próprio conectado (aparece como endereço do site) */
  customDomain?: string | null;
}

/** O aviso sobre o que vale na hora e, em telas menores, a prévia abaixo do formulário. */
function NotaEPreviaDoCelular({ previa }: { previa: ReactNode }) {
  return (
    <>
      <p className="text-sm text-tinta-suave">
        Ligar ou desligar uma seção vale na hora. Os textos e as fotos só vão para o site quando vocês tocam em “Publicar alterações”.
      </p>
      <details className="xl:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-ameixa">Mostrar prévia do site</summary>
        <div className="mt-3">{previa}</div>
      </details>
    </>
  );
}

export function EditorDoSiteCliente({ initialSettings, initialStoryItems, initialTips, previewGifts, rsvpDeadline, slug, customDomain }: PropriedadesDoEditorDoSiteCliente) {
  const [ocupado, iniciar] = useTransition();
  const [secaoAberta, setSecaoAberta] = useState<IdDaSecao | null>("COVER");
  const endereco = urlDoSiteDoCasamento(slug, undefined, customDomain).replace(/^https?:\/\//, "");
  const site = useConfiguracoesDoSite(initialSettings, endereco, iniciar);
  const foto = useEnvioDeFoto(site.atualizar, iniciar);
  const historia = useHistoria(initialStoryItems, iniciar);
  const dicas = useDicas(initialTips, iniciar);
  const exclusao = useExclusaoDeItem(historia.remover, dicas.remover, iniciar);
  const previa = <PreviaDoSite slug={slug} endereco={endereco} alterado={site.alterado} configuracoes={site.configuracoes} momentos={historia.itens} dicas={dicas.itens} presentes={previewGifts} rsvpDeadline={rsvpDeadline} />;

  return (
    <div className="flex flex-col gap-5">
      <CabecalhoDoEditor slug={slug} endereco={endereco} site={site} ocupado={ocupado} />
      <div className="grid gap-6 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)] xl:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <ol className="flex flex-col gap-1.5">
            {SECOES.map((secao) => (
              <LinhaDaSecao
                key={secao.id}
                id={secao.id}
                title={secao.label}
                visible={secao.key ? site.configuracoes[secao.key] !== false : undefined}
                open={secaoAberta === secao.id}
                onToggle={() => setSecaoAberta((atual) => (atual === secao.id ? null : secao.id))}
              >
                <ConteudoDaSecao id={secao.id} chave={secao.key} descricao={secao.desc} site={site} foto={foto} historia={historia} dicas={dicas} ocupado={ocupado} pedirExclusao={exclusao.setPendente} />
              </LinhaDaSecao>
            ))}
          </ol>
          <NotaEPreviaDoCelular previa={previa} />
        </div>
        <div className="sticky top-4 hidden min-w-0 rounded-2xl bg-areia p-4 xl:block 2xl:p-6">
          <p className="mb-3 text-sm font-semibold text-tinta-suave">Prévia ao vivo</p>
          {previa}
        </div>
      </div>
      <ModalDeConfirmacao
        isOpen={exclusao.pendente !== null}
        onClose={() => exclusao.setPendente(null)}
        onConfirm={exclusao.confirmar}
        isLoading={ocupado}
        title={exclusao.pendente?.tipo === "story" ? "Remover momento?" : "Remover dica?"}
        description={`“${exclusao.pendente?.title ?? ""}” deixa de aparecer no site.`}
        confirmText="Remover"
      />
    </div>
  );
}
