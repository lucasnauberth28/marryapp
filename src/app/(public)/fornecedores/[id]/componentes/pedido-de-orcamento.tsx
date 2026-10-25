import { Building2, CheckCircle2, Video } from "lucide-react";
import type { FornecedorPublico } from "@/actions/vitrine/consulta";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { SelecaoNativa } from "@/components/ui/select";
import { SeletorDeData } from "@/components/ui/date-picker";
import { estiloDoBotao } from "@/components/landing/styles";
import { OPCOES_DE_ORCAMENTO_DO_PEDIDO } from "@/app/(fornecedor)/_lib/pedidos";
import { formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import { cn } from "@/lib/utils";
import { ConferenciaDeDisponibilidade } from "./disponibilidade";
import { classeDoRotulo } from "./estilos";
import { usePedidoDeOrcamento, type CamposDoPedido, type TipoDeReuniao } from "./use-pedido-de-orcamento";

const REUNIOES = [
  ["ONLINE", "Por vídeo", Video],
  ["PRESENTIAL", "Presencial", Building2],
] as const;

function EscolhaDaReuniao({ valor, aoEscolher }: { valor: TipoDeReuniao; aoEscolher: (v: TipoDeReuniao) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={cn(classeDoRotulo, "mb-2")}>Como prefere conversar?</legend>
      <div className="grid grid-cols-2 gap-2">
        {REUNIOES.map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            aria-pressed={valor === value}
            onClick={() => aoEscolher(value)}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] border px-3 text-base font-semibold transition-colors",
              valor === value ? "border-ameixa bg-ameixa-suave text-ameixa" : "border-linha-forte bg-papel text-tinta-suave hover:border-ameixa",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function CamposDoOrcamento({ campos }: { campos: CamposDoPedido }) {
  return (
    <>
      <Entrada id="lead-nome" name="name" label="Seu nome" autoComplete="name" value={campos.coupleName} onChange={(e) => campos.setCoupleName(e.target.value)} placeholder="Ex.: Giovanna" required />
      <Entrada
        id="lead-telefone"
        name="phone"
        label="Seu WhatsApp com DDD"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={campos.couplePhone}
        onChange={(e) => campos.setCouplePhone(e.target.value)}
        placeholder="(11) 99999-9999"
        required
      />
      <SeletorDeData id="lead-data" label="Data do casamento" value={campos.weddingDate} onChange={(e) => campos.setWeddingDate(e.target.value)} placeholder="Escolha a data" />
      <Entrada id="lead-cidade" label="Cidade do casamento" value={campos.leadLocation} onChange={(e) => campos.setLeadLocation(e.target.value)} placeholder="Ex.: Itu, SP" maxLength={80} autoComplete="address-level2" />
      <SelecaoNativa id="lead-orcamento" label="Orçamento previsto" optional value={campos.leadBudget} onChange={(e) => campos.setLeadBudget(e.target.value)}>
        <option value=""></option>
        {OPCOES_DE_ORCAMENTO_DO_PEDIDO.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </SelecaoNativa>
    </>
  );
}

function PedidoEnviado({ companyName, coupleName, whatsapp, aoRecomecar }: { companyName: string; coupleName: string; whatsapp: string | null; aoRecomecar: () => void }) {
  return (
    <div role="status" className="flex flex-col gap-3 rounded-[16px] border border-sucesso/30 bg-sucesso-suave p-4 text-base text-tinta">
      <p className="flex items-center gap-2 font-semibold">
        <CheckCircle2 className="size-5 shrink-0 text-sucesso" aria-hidden="true" />
        Pedido enviado para {companyName}
      </p>
      <p className="text-tinta-suave">Recebemos os seus dados, {coupleName.split(" ")[0]}. O fornecedor vai entrar em contato pelo WhatsApp que você informou.</p>
      {whatsapp ? (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Sou ${coupleName} e acabei de pedir um orçamento pelo Aceito.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(estiloDoBotao.primary, estiloDoBotao.block)}
        >
          Conversar agora no WhatsApp
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      ) : null}
      <button type="button" onClick={aoRecomecar} className={cn(estiloDoBotao.quiet, estiloDoBotao.block)}>
        Fazer outro pedido
      </button>
    </div>
  );
}

function FormularioDoOrcamento({ pedido, whatsapp }: { pedido: ReturnType<typeof usePedidoDeOrcamento>; whatsapp: string | null }) {
  const { campos } = pedido;
  return (
    <form onSubmit={pedido.enviar} className="flex flex-col gap-5">
      <CamposDoOrcamento campos={campos} />
      <EscolhaDaReuniao valor={campos.meetingType} aoEscolher={campos.setMeetingType} />
      <Botao type="submit" loading={pedido.isPending} className="w-full rounded-[12px] px-6">
        Pedir orçamento
      </Botao>
      {whatsapp ? (
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className={cn(estiloDoBotao.secondary, estiloDoBotao.block)}>
          Conversar no WhatsApp
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      ) : null}
    </form>
  );
}

interface Propriedades {
  vendor: FornecedorPublico;
  todayIso: string;
  price: string | null;
  /** Só Pro/Master: o servidor nem envia o número dos demais planos. */
  whatsapp: string | null;
}

/** Cartão lateral: preço, consulta de data e pedido de orçamento. */
export function PedidoDeOrcamento({ vendor, todayIso, price, whatsapp }: Propriedades) {
  const pedido = usePedidoDeOrcamento(vendor);
  return (
    <aside className="min-w-0 max-w-[400px] flex-[1_1_320px] max-lg:max-w-none lg:sticky lg:top-24">
      <div className="flex flex-col gap-5 rounded-[16px] border border-linha bg-papel p-6 shadow-aceito-2">
        <p className="flex flex-col">
          <span className="text-tinta-suave">{price ? "A partir de" : "Preço"}</span>
          <span className="font-num text-[34px] leading-10 text-tinta">{price ?? "Sob consulta"}</span>
          {vendor.averageTicket ? <span className="mt-1 text-sm text-tinta-suave">Valor médio dos serviços: {formatarReaisInteiros(vendor.averageTicket)}</span> : null}
        </p>

        <ConferenciaDeDisponibilidade vendorId={vendor.id} todayIso={todayIso} />

        <div id="orcamento" className="scroll-mt-24 border-t border-linha pt-5">
          <h2 className="font-display text-[22px] font-medium leading-7 text-tinta">Pedir orçamento</h2>
          <p className="mb-4 mt-1 text-sm leading-5 text-tinta-suave">Envie seus dados e o fornecedor responde com a disponibilidade na sua data.</p>
          {pedido.sentTo ? (
            <PedidoEnviado companyName={vendor.companyName} coupleName={pedido.sentTo.coupleName} whatsapp={whatsapp} aoRecomecar={() => pedido.setSentTo(null)} />
          ) : (
            <FormularioDoOrcamento pedido={pedido} whatsapp={whatsapp} />
          )}
        </div>
      </div>
    </aside>
  );
}
