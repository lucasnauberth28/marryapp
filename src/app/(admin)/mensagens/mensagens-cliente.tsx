"use client";
// A página de mensagens: envios rápidos, as mensagens salvas e as janelas de escrever/editar e de enviar.
import { useState, type ComponentProps } from "react";
import type { Guest } from "@prisma/client";
import { Plus } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { estiloDoBotao } from "@/components/painel/styles";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { CartaoDoConvite } from "./componentes/cartao-do-convite";
import { EnviosRapidos } from "./componentes/envios-rapidos";
import { FluxoDeEnvio } from "./componentes/fluxo-de-envio";
import { FormularioDoEditor } from "./componentes/formulario-do-editor";
import { ListaDeMensagens } from "./componentes/lista-de-mensagens";
import type { ModeloDeMensagem } from "./componentes/tipos";
import { temTelefone } from "./componentes/utilitarios";

export type { ModeloDeMensagem } from "./componentes/tipos";

interface PropriedadesDasMensagensCliente {
  initialTemplates: ModeloDeMensagem[];
  initialGuests: Guest[];
  coupleNames: string;
  /** Endereço público do casamento, para os links das mensagens */
  slug: string;
  /** Domínio próprio conectado: os links das mensagens passam a usá-lo */
  customDomain?: string | null;
  /** Convite digital animado: se o plano tem, as escolhas do casal e o endereço para ver como fica. */
  convite: ComponentProps<typeof CartaoDoConvite>;
}

function descricaoDaPagina(convidados: Guest[]) {
  const comTelefone = convidados.filter(temTelefone).length, receberam = convidados.filter((g) => g.hasReceivedMessage).length;
  const parteDosEnvios = receberam > 0 ? ` e ${receberam} já ${receberam === 1 ? "recebeu" : "receberam"} mensagem por aqui` : "";
  return `${comTelefone} ${comTelefone === 1 ? "convidado tem" : "convidados têm"} telefone cadastrado${parteDosEnvios}.`;
}

export function MensagensCliente({ initialTemplates, initialGuests, coupleNames, slug, customDomain, convite }: PropriedadesDasMensagensCliente) {
  const [modelos, setModelos] = useState<ModeloDeMensagem[]>(initialTemplates);
  // "novo" = escrevendo uma mensagem nova
  const [editando, setEditando] = useState<ModeloDeMensagem | "novo" | null>(null);
  const [enviando, setEnviando] = useState<ModeloDeMensagem | null>(null);
  const nomeDeExemplo = initialGuests[0]?.name.split(" ")[0] ?? "Nome";

  return (
    <div className="flex flex-col gap-10">
      <CabecalhoDaPagina
        eyebrow="Convidados"
        title="Mensagens"
        description={descricaoDaPagina(initialGuests)}
        actions={
          <button type="button" onClick={() => setEditando("novo")} className={estiloDoBotao.secondary}>
            <Plus className="size-4" aria-hidden="true" />
            Nova mensagem
          </button>
        }
      />
      <EnviosRapidos convidados={initialGuests} />
      <CartaoDoConvite {...convite} />
      <ListaDeMensagens modelos={modelos} nomeDeExemplo={nomeDeExemplo} aoCriar={() => setEditando("novo")} aoEnviar={setEnviando} aoEditar={setEditando} />
      <ModalPersonalizado isOpen={editando !== null} onClose={() => setEditando(null)} title={editando === "novo" ? "Nova mensagem" : "Editar mensagem"} description="Escrevam o texto e vejam, ao lado, como ele chega no WhatsApp." size="xl" className="max-h-[92dvh] overflow-y-auto">
        {editando !== null ? (
          <FormularioDoEditor
            key={editando === "novo" ? "novo" : editando.id}
            template={editando === "novo" ? null : editando}
            sampleName={nomeDeExemplo}
            slug={slug}
            customDomain={customDomain}
            coupleNames={coupleNames}
            onCancel={() => setEditando(null)}
            onSaved={(t, criada) => {
              setModelos((prev) => (criada ? [t, ...prev] : prev.map((x) => (x.id === t.id ? t : x))));
              setEditando(null);
            }}
            onDeleted={(id) => {
              setModelos((prev) => prev.filter((t) => t.id !== id));
              setEditando(null);
            }}
          />
        ) : null}
      </ModalPersonalizado>
      <ModalPersonalizado isOpen={enviando !== null} onClose={() => setEnviando(null)} title={enviando ? `Enviar “${enviando.name}”` : "Enviar"} description="Escolham quem recebe. O envio usa o texto salvo da mensagem." size="xl" className="max-h-[92dvh] overflow-y-auto">
        {enviando ? <FluxoDeEnvio key={enviando.id} template={enviando} guests={initialGuests} slug={slug} customDomain={customDomain} coupleNames={coupleNames} onDone={() => setEnviando(null)} /> : null}
      </ModalPersonalizado>
    </div>
  );
}
