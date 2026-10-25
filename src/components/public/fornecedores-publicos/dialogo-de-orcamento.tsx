// Janela do pedido de orçamento: o formulário e, depois do envio, a confirmação com o atalho para o WhatsApp.
import { Building2, Calendar, CheckCircle2, Video } from "lucide-react";
import { Botao } from "@/components/ui/button";
import { SeletorDeData } from "@/components/ui/date-picker";
import { ConteudoDoDialogo, CabecalhoDoDialogo, DescricaoDoDialogo, Dialogo, TituloDoDialogo } from "@/components/ui/dialog";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import type { PedidoDeOrcamento, TipoDeReuniao } from "./use-pedido-de-orcamento";

function PedidoConfirmado({ pedido }: { pedido: PedidoDeOrcamento }) {
  const enviado = pedido.enviado!;
  return (
    <div role="status" className="space-y-3 pt-2 text-sm text-tinta">
      <p className="flex items-start gap-2 rounded-2xl bg-sucesso-suave p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sucesso" aria-hidden="true" />
        <span>{enviado.vendor} recebeu o seu pedido e vai entrar em contato pelo WhatsApp que você informou.</span>
      </p>
      {enviado.whatsapp ? (
        <a href={`https://wa.me/${enviado.whatsapp}?text=${encodeURIComponent(enviado.text)}`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center rounded-full bg-tinta px-4 font-bold text-papel">
          Conversar agora no WhatsApp
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      ) : null}
      <Botao type="button" variant="ghost" className="h-11 w-full rounded-full font-semibold text-ameixa" onClick={() => pedido.setAberto(false)}>Voltar aos fornecedores</Botao>
    </div>
  );
}

function EscolhaDaReuniao({ valor, aoEscolher }: { valor: TipoDeReuniao; aoEscolher: (v: TipoDeReuniao) => void }) {
  const botao = (tipo: TipoDeReuniao, Icone: typeof Video, texto: string) => (
    <button type="button" aria-pressed={valor === tipo} onClick={() => aoEscolher(tipo)} className={`min-h-11 p-3 rounded-2xl border text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer ${valor === tipo ? "bg-brand-50 border-brand text-brand" : "bg-linho border-linha text-tinta-suave"}`}>
      <Icone className="w-3.5 h-3.5" />
      <span>{texto}</span>
    </button>
  );
  return (
    <div role="group" aria-labelledby="vl-conversa" className="flex flex-col gap-1.5">
      <span id="vl-conversa" className="text-sm font-semibold text-tinta">Como prefere conversar?</span>
      <div className="grid grid-cols-2 gap-2">{botao("ONLINE", Video, "Por vídeo")}{botao("PRESENTIAL", Building2, "Presencial")}</div>
    </div>
  );
}

function FormularioDoPedido({ pedido }: { pedido: PedidoDeOrcamento }) {
  return (
    <form onSubmit={pedido.enviar} className="flex flex-col gap-5 pt-5">
      <Entrada id="vl-nome" name="name" label="Seu nome ou o nome do casal" autoComplete="name" value={pedido.campos.nome} onChange={(e) => pedido.definir("nome")(e.target.value)} placeholder="Ex.: Giovanna e Lucas" required />
      <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 min-[480px]:gap-3">
        <Entrada id="vl-telefone" name="phone" label="WhatsApp com DDD" type="tel" inputMode="tel" autoComplete="tel-national" value={pedido.campos.telefone} onChange={(e) => pedido.definir("telefone")(e.target.value)} placeholder="(11) 99999-9999" required />
        <Entrada id="vl-email" name="email" label="E-mail" optional autoComplete="email" type="email" value={pedido.campos.email} onChange={(e) => pedido.definir("email")(e.target.value)} placeholder="noivos@email.com" />
      </div>
      <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 min-[480px]:gap-3">
        <Entrada id="vl-convidados" label="Nº de convidados" inputMode="numeric" min={1} type="number" value={pedido.campos.convidados} onChange={(e) => pedido.definir("convidados")(e.target.value)} placeholder="Ex: 150" />
        <SeletorDeData id="vl-data" label="Data do casamento" value={pedido.campos.dataDoCasamento} onChange={(e) => pedido.definir("dataDoCasamento")(e.target.value)} placeholder="Escolher" />
      </div>
      <EscolhaDaReuniao valor={pedido.reuniao} aoEscolher={pedido.setReuniao} />
      <AreaDeTexto id="vl-mensagem" label="Recado para o fornecedor" optional value={pedido.campos.recado} onChange={(e) => pedido.definir("recado")(e.target.value)} placeholder="Conte o estilo do casamento ou tire uma dúvida" rows={3} />
      <Botao type="submit" loading={pedido.enviando} className="w-full bg-brand hover:bg-brand-600 text-white rounded-full font-bold h-12 text-sm shadow-md gap-2 mt-2">
        <Calendar className="w-4 h-4" />
        <span>Enviar pedido</span>
      </Botao>
    </form>
  );
}

export function DialogoDeOrcamento({ pedido }: { pedido: PedidoDeOrcamento }) {
  const { enviado, fornecedor } = pedido;
  return (
    <Dialogo open={pedido.aberto} onOpenChange={pedido.setAberto}>
      <ConteudoDoDialogo className="sm:max-w-md bg-papel rounded-[16px] p-6">
        <CabecalhoDoDialogo>
          <TituloDoDialogo className="font-display text-xl text-tinta">{enviado ? "Pedido enviado" : "Pedir orçamento ou reunião"}</TituloDoDialogo>
          <DescricaoDoDialogo className="text-sm text-tinta-suave mt-1">
            {enviado ? <>Recebemos os seus dados, {enviado.first}.</> : <>Os seus dados vão direto para <strong>{fornecedor?.companyName}</strong>, que responde pelo WhatsApp.</>}
          </DescricaoDoDialogo>
        </CabecalhoDoDialogo>
        {enviado ? <PedidoConfirmado pedido={pedido} /> : <FormularioDoPedido pedido={pedido} />}
      </ConteudoDoDialogo>
    </Dialogo>
  );
}
