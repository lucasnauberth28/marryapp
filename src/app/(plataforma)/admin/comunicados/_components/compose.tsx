"use client";

import { Pencil } from "lucide-react";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { ROTULO_DO_CANAL } from "@/lib/platform/announcement";
import { pluralizar } from "@/lib/formatacao/plural";
import type { PrevisaoDoPublico } from "@/lib/platform/queries/comunicados";
import { ModelosProntos } from "../_redacao/modelos-prontos";
import { PreviaDoComunicado } from "../_redacao/previa";
import { ListaDeRascunhos } from "../_redacao/rascunhos";
import { SecaoCanais } from "../_redacao/secao-canais";
import { BotoesDaRedacao, SecaoConteudo } from "../_redacao/secao-conteudo";
import { SecaoPublico } from "../_redacao/secao-publico";
import type { ItemDeRascunho, ValoresIniciaisDaRedacao } from "../_redacao/tipos";
import { useRedacao, type RedacaoDoComunicado } from "../_redacao/use-redacao";

export type { ItemDeRascunho, ValoresIniciaisDaRedacao };

interface Propriedades {
  initial: ValoresIniciaisDaRedacao;
  initialPreview: PrevisaoDoPublico | null;
  drafts: ItemDeRascunho[];
  emailConfigured: boolean;
}

function FormularioDaRedacao({ r, emailConfigured }: { r: RedacaoDoComunicado; emailConfigured: boolean }) {
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        r.askToSend();
      }}
    >
      <SecaoPublico r={r} />
      <SecaoCanais channels={r.channels} emailConfigured={emailConfigured} error={r.errors.channels} aoAlternar={r.toggleChannel} />
      <SecaoConteudo r={r} />
      {r.formError && !Object.keys(r.errors).length && <AvisoDoFormulario>{r.formError}</AvisoDoFormulario>}
      <BotoesDaRedacao r={r} />
      <p className="text-sm leading-5 text-tinta-suave">O envio é imediato: não há agendamento. Quem já recebeu não recebe de novo se o envio for retomado.</p>
    </form>
  );
}

export function RedacaoDeComunicado({ initial, initialPreview, drafts, emailConfigured }: Propriedades) {
  const r = useRedacao(initial, initialPreview);
  const channelNames = r.channels.map((c) => ROTULO_DO_CANAL[c].toLowerCase()).join(", ");

  return (
    <div className="flex flex-col gap-6">
      <ModelosProntos aoEscolher={r.applyTemplate} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Painel
          title={r.draftId ? "Editar rascunho" : "Novo comunicado"}
          aside={
            <EtiquetaDeSituacao tone="neutro" icon={Pencil}>
              Rascunho
            </EtiquetaDeSituacao>
          }
        >
          <FormularioDaRedacao r={r} emailConfigured={emailConfigured} />
        </Painel>

        <div className="flex min-w-0 flex-col gap-6">
          <PreviaDoComunicado title={r.title} emailSubject={r.emailSubject} body={r.body} linkUrl={r.linkUrl} />
          <ListaDeRascunhos drafts={drafts} draftId={r.draftId} />
        </div>
      </div>

      <ModalDeConfirmacao
        isOpen={r.confirmOpen}
        onClose={() => r.setConfirmOpen(false)}
        variant="default"
        title="Enviar o comunicado agora?"
        description={`Vai para ${r.preview ? pluralizar(r.preview.people, "pessoa", "pessoas") : "o público escolhido"} por ${channelNames || "nenhum canal"}. Não dá para desfazer nem agendar.`}
        confirmText="Enviar agora"
        isLoading={r.sending}
        onConfirm={r.sendNow}
      />
    </div>
  );
}
