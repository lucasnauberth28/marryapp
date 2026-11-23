"use client";
// A fila de envio: cada pessoa tem um botão que abre o WhatsApp do casal com a mensagem pronta. O casal toca em Enviar por lá e volta.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageCircle } from "lucide-react";
import { montarFilaDeMensagem, registrarEnvioNoWhatsapp, type ItemDaFila } from "@/actions/mensagens/fila";
import { estiloDaCaixaDeErro, estiloDoBotao } from "@/components/painel/styles";
import { cn } from "@/lib/utils";

interface PropriedadesDaFila {
  templateId: string;
  /** Convite inicial: cada abertura conta como convite enviado. */
  ehConvite: boolean;
  guestIds: string[];
  aoFechar: () => void;
}

function useFila(templateId: string, guestIds: string[], ehConvite: boolean) {
  const router = useRouter();
  const [itens, setItens] = useState<ItemDaFila[] | null>(null);
  const [erro, setErro] = useState("");
  const [abertos, setAbertos] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let vivo = true;
    montarFilaDeMensagem(templateId, guestIds).then((r) => {
      if (!vivo) return;
      if (r.success) setItens(r.itens);
      else setErro(r.error);
    });
    return () => {
      vivo = false;
    };
  }, [templateId, guestIds]);

  /** O WhatsApp abre pelo próprio link (nova aba); aqui só se anota o envio, sem segurar a abertura. */
  const aoAbrir = (item: ItemDaFila) => {
    setAbertos((prev) => new Set(prev).add(item.guestId));
    void registrarEnvioNoWhatsapp({ guestId: item.guestId, convite: ehConvite }).then((r) => {
      if (r.success) return router.refresh();
      setErro(r.error);
    });
  };
  return { itens, erro, abertos, aoAbrir };
}

export function FilaDeEnvio({ templateId, ehConvite, guestIds, aoFechar }: PropriedadesDaFila) {
  const { itens, erro, abertos, aoAbrir } = useFila(templateId, guestIds, ehConvite);
  const feitos = itens ? itens.filter((i) => abertos.has(i.guestId)).length : 0;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-6 text-tinta-suave">
        Toquem em <strong className="font-semibold text-tinta">Abrir no WhatsApp</strong>, enviem a mensagem por lá e voltem para a próxima pessoa. A mensagem vai do WhatsApp de vocês, então chega de um número que o convidado conhece.
      </p>
      {erro ? <p role="alert" className={estiloDaCaixaDeErro}>{erro}</p> : null}
      {itens === null && !erro ? <p role="status" className="text-sm text-tinta-suave">Montando a fila...</p> : null}
      {itens ? (
        <>
          <p role="status" className="text-sm font-semibold text-tinta">
            {feitos} de {itens.length} abertos
          </p>
          <ul className="flex max-h-[50dvh] flex-col divide-y divide-linha overflow-y-auto rounded-2xl border border-linha">
            {itens.map((item) => {
              const aberto = abertos.has(item.guestId);
              return (
                <li key={item.guestId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-tinta">{item.name}</p>
                    {item.jaRecebeu && !aberto ? <p className="text-xs text-tinta-suave">Já recebeu uma mensagem por aqui</p> : null}
                  </div>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => aoAbrir(item)} className={cn(aberto ? estiloDoBotao.secondary : estiloDoBotao.primary, "min-h-11 shrink-0")} aria-label={`${aberto ? "Abrir de novo" : "Abrir no WhatsApp"}: ${item.name}`}>
                    {aberto ? <Check className="size-4" aria-hidden="true" /> : <MessageCircle className="size-4" aria-hidden="true" />}
                    {aberto ? "Aberto" : "Abrir no WhatsApp"}
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
      <div>
        <button type="button" onClick={aoFechar} className={estiloDoBotao.secondary}>
          Fechar
        </button>
      </div>
    </div>
  );
}
