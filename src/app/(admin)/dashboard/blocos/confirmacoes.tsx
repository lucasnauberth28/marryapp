import { Check, Clock, Minus } from "lucide-react";
import { rotuloDeConvites, rotuloDePessoas, type ContagemDeConvidados } from "@/lib/dashboard-summary";
import { BlocoDoPainel, Etiqueta, LinkDeTexto, MedidorDeProgresso, classeDaDica, classeDoRotulo } from "../ui";

/** Um número do bloco de confirmações: rótulo, valor, unidade e contexto. */
function NumeroEmDestaque({ label, value, unit, hint }: { label: string; value: number; unit: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-1 border-linha px-5 first:pl-0 first:border-l-0 max-md:[&:nth-child(3)]:col-span-full max-md:[&:nth-child(3)]:border-l-0 max-md:[&:nth-child(3)]:border-t max-md:[&:nth-child(3)]:px-0 max-md:[&:nth-child(3)]:pt-3.5 md:border-l">
      <span className={classeDoRotulo}>{label}</span>
      <span className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] tabular-nums text-tinta">
        {value.toLocaleString("pt-BR")}{" "}
        <span className="mt-1 block text-sm font-medium tracking-normal text-tinta-suave">{unit}</span>
      </span>
      {hint && <span className={classeDaDica}>{hint}</span>}
    </div>
  );
}

function Legenda({ icone: Icone, cor, rotulo, valor }: { icone: typeof Check; cor: string; rotulo: string; valor: number }) {
  return (
    <li className="flex items-center gap-1.5">
      <Icone className="size-3.5" aria-hidden="true" />
      <i className={`block size-2.5 rounded-[3px] ${cor}`} aria-hidden="true" />
      {rotulo} <b className="font-semibold tabular-nums text-tinta">{rotuloDeConvites(valor)}</b>
    </li>
  );
}

function MedidorDeConfirmacoes({ c }: { c: ContagemDeConvidados["invites"] }) {
  return (
    <div className="grid gap-2.5">
      <MedidorDeProgresso
        height={10}
        label={`${c.confirmed} convites confirmados, ${c.declined} não vão e ${c.pending} sem resposta, de ${c.total} convites`}
        segments={[
          { value: c.confirmed, className: "bg-sucesso" },
          { value: c.declined, className: "bg-linha-forte" },
          { value: c.pending, className: "bg-areia" },
        ]}
      />
      <ul className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-[13px] text-tinta-suave">
        <Legenda icone={Check} cor="bg-sucesso" rotulo="Confirmados" valor={c.confirmed} />
        <Legenda icone={Minus} cor="bg-linha-forte" rotulo="Não vão" valor={c.declined} />
        <Legenda icone={Clock} cor="bg-areia ring-1 ring-inset ring-linha" rotulo="Sem resposta" valor={c.pending} />
      </ul>
    </div>
  );
}

interface PropriedadesDasConfirmacoes {
  counts: ContagemDeConvidados;
  /** "Prazo em 15 mar 2027", quando o casal definiu um. */
  deadlineHint: string | null;
  /** Prazo chegando: troca a dica por um chip de atenção. */
  deadlineChip: string | null;
  canOpenList: boolean;
  className?: string;
}

export function BlocoDeConfirmacoes({ counts, deadlineHint, deadlineChip, canOpenList, className = "" }: PropriedadesDasConfirmacoes) {
  const { invites: c, people: p } = counts;
  return (
    <BlocoDoPainel id="confirmacoes" title="Confirmações de presença" aside={canOpenList ? <LinkDeTexto href="/convidados">Ver lista</LinkDeTexto> : null} className={className}>
      <div className="grid grid-cols-2 gap-y-4 md:grid-cols-3">
        <NumeroEmDestaque label="Convites confirmados" value={c.confirmed} unit={`de ${rotuloDeConvites(c.total)}`} />
        <NumeroEmDestaque label="Pessoas confirmadas" value={p.confirmed} unit={`de ${rotuloDePessoas(p.total)}`} hint="Número para o buffet" />
        <NumeroEmDestaque
          label="Sem resposta"
          value={c.pending}
          unit={`${c.pending === 1 ? "convite" : "convites"} · ${rotuloDePessoas(p.pending)}`}
          hint={deadlineChip ? <Etiqueta tone="aviso" icon={Clock}>{deadlineChip}</Etiqueta> : deadlineHint}
        />
      </div>
      <MedidorDeConfirmacoes c={c} />
    </BlocoDoPainel>
  );
}
