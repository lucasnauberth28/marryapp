"use client";
// Convite digital animado: o casal escolhe se o nome de cada convidado aparece e qual frase vai no convite.
import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";
import { salvarEscolhasDoConvite } from "@/actions/convite/escolhas";
import { estiloDoBotao } from "@/components/painel/styles";
import { AreaDeTexto } from "@/components/ui/textarea";
import { Interruptor } from "@/components/ui/switch";
import { Etiqueta, estiloDoCartao, estiloDoSobretitulo } from "@/components/casal/ui";

interface Propriedades {
  /** O plano do casal tem o convite digital (Classic e VIP). */
  disponivel: boolean;
  guestName: boolean;
  message: string | null;
  /** Endereço do convite, para o casal ver como fica. */
  linkDeExemplo: string;
}

function Escolhas({ guestName, message, linkDeExemplo }: Omit<Propriedades, "disponivel">) {
  const [mostrarNome, setMostrarNome] = useState(guestName);
  const [frase, setFrase] = useState(message ?? "");
  const [ocupado, iniciar] = useTransition();

  const salvar = (alteracao: { guestName?: boolean; message?: string }, aoFalhar?: () => void) =>
    iniciar(async () => {
      const resposta = await salvarEscolhasDoConvite(alteracao);
      if (resposta.success) return void toast.success("Convite atualizado.");
      aoFalhar?.();
      toast.error(resposta.error || "Não deu para salvar. Tente de novo.");
    });

  const alternarNome = (marcada: boolean) => {
    setMostrarNome(marcada);
    salvar({ guestName: marcada }, () => setMostrarNome(!marcada));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-xl bg-linho px-3 py-2">
        <div className="min-w-0">
          <label htmlFor="convite-nome" className="text-sm font-semibold text-tinta">Colocar o nome de cada convidado no convite</label>
          <p className="text-sm text-tinta-suave">{mostrarNome ? "Cada pessoa vê o próprio nome no envelope e na carta." : "Todos recebem o mesmo convite, sem nome."}</p>
        </div>
        <Interruptor id="convite-nome" checked={mostrarNome} disabled={ocupado} onCheckedChange={alternarNome} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="convite-frase" className="text-sm font-semibold text-tinta">Frase do convite <span className="font-normal text-tinta-suave">(opcional)</span></label>
        <AreaDeTexto id="convite-frase" rows={2} maxLength={300} value={frase} onChange={(e) => setFrase(e.target.value)} placeholder="Será uma alegria celebrar esse dia com você." />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`} disabled={ocupado || frase === (message ?? "")} onClick={() => salvar({ message: frase })}>Salvar frase</button>
          <a href={linkDeExemplo} target="_blank" rel="noopener noreferrer" className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm}`}>
            Ver como fica <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
      <p className="text-sm text-tinta-suave">As cores e as letras seguem o modelo do site. Para trocar, abram <Link href="/site-builder" className="font-semibold text-ameixa">Editar o site</Link>.</p>
    </div>
  );
}

export function CartaoDoConvite({ disponivel, ...escolhas }: Propriedades) {
  return (
    <section aria-labelledby="convite-digital" className={`${estiloDoCartao} flex flex-col gap-4 p-5 md:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ameixa-suave text-ameixa" aria-hidden="true"><Mail className="size-5" /></span>
          <div>
            <p className={estiloDoSobretitulo}>Convite digital</p>
            <h2 id="convite-digital" className="text-xl font-semibold leading-7 text-tinta">Um convite animado, só de vocês</h2>
            <p className="text-sm text-tinta-suave">Vai como link na mensagem de convite: o envelope abre, o nome da pessoa aparece e ela confirma ali mesmo.</p>
          </div>
        </div>
        {disponivel ? <Etiqueta tone="sucesso">Ativo</Etiqueta> : <Etiqueta tone="neutro">Classic e VIP</Etiqueta>}
      </div>
      {disponivel ? <Escolhas {...escolhas} /> : <p className="text-sm text-tinta-suave">O convite digital faz parte dos planos Classic e VIP. <Link href="/plano" className="font-semibold text-ameixa">Ver os planos</Link></p>}
    </section>
  );
}
