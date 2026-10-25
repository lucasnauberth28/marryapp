import { Link2, Send } from "lucide-react";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import type { RedacaoDoComunicado } from "./use-redacao";

export function SecaoConteudo({ r }: { r: RedacaoDoComunicado }) {
  const { errors } = r;
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 text-base font-semibold text-tinta">O que dizer</legend>
      <Entrada label="Título" value={r.title} onChange={(e) => r.setTitle(e.target.value)} error={errors.title} maxLength={90} />
      <Entrada label="Assunto do e-mail" optional value={r.emailSubject} onChange={(e) => r.setEmailSubject(e.target.value)} error={errors.emailSubject} maxLength={120} hint="Se ficar vazio, o e-mail usa o título." />
      <AreaDeTexto label="Mensagem" value={r.body} onChange={(e) => r.setBody(e.target.value)} error={errors.body} rows={5} maxLength={1000} hint="Texto simples. Uma linha em branco separa os parágrafos." />
      <Entrada label="Link do botão" optional icon={Link2} value={r.linkUrl} onChange={(e) => r.setLinkUrl(e.target.value)} error={errors.linkUrl} inputMode="url" placeholder="https://" />
    </fieldset>
  );
}

export function BotoesDaRedacao({ r }: { r: RedacaoDoComunicado }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Botao type="submit" disabled={r.busy}>
        <Send className="size-4" aria-hidden="true" /> Enviar agora
      </Botao>
      <Botao type="button" variant="outline" disabled={r.busy && !r.testing} loading={r.testing} onClick={r.sendTest}>
        Enviar um teste para mim
      </Botao>
      <Botao type="button" variant="quiet" disabled={r.busy && !r.saving} loading={r.saving} onClick={r.saveDraft}>
        Salvar rascunho
      </Botao>
    </div>
  );
}
