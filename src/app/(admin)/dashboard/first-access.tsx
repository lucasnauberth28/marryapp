// Primeiro acesso: casamento novo, ainda sem convidados. Nada de painel em branco: o convite já está pronto,
// o caminho tem 3 passos (o primeiro já feito) e as amostras vêm marcadas como "Exemplo".
import Link from "next/link";
import { Check, MessageCircle, UserPlus } from "lucide-react";
import { IlustracaoDaLiz } from "@/components/liz/liz-illustration";
import { BlocoDoPainel, Etiqueta, MedidorDeProgresso, estiloDoBotaoPrimario, estiloDoBotaoSecundario, classeDaDica, classeDoRotulo } from "./ui";

export function FilaDoPrimeiroAcesso({ canAddGuests, className = "" }: { canAddGuests: boolean; className?: string }) {
  return (
    <BlocoDoPainel id="agora" title="O que fazer agora" aside={<span>1 de 3 feitos</span>} className={className}>
      <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3.5 border-b border-linha pb-4">
        <IlustracaoDaLiz pose="boas-vindas" height={106} decorative className="h-auto w-16" />
        <p className="text-pretty text-[14.5px] leading-[1.45] text-tinta">
          <strong className="block text-[13px] font-semibold text-ameixa">A Liz sugere o próximo passo</strong>
          Adicionem a primeira pessoa da lista e mandem o convite para ela. A primeira resposta aparece aqui no Resumo.
        </p>
      </div>
      <MedidorDeProgresso height={6} label="1 de 3 passos feitos" segments={[{ value: 1, className: "bg-ameixa" }, { value: 2, className: "bg-areia" }]} />
      <ol className="grid">
        <li className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3.5 gap-y-1 border-t border-linha py-3.5 first:border-t-0 first:pt-0">
          <span className="grid size-10 place-items-center rounded-full bg-sucesso-suave text-sucesso">
            <Check className="size-[19px]" aria-hidden="true" />
          </span>
          <p className="grid min-h-10 content-center text-[14.5px] leading-[1.45] text-tinta-suave line-through decoration-linha-forte">
            <span className="sr-only">Feito: </span>Criar o site com os nomes e a data
          </p>
        </li>
        <li className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3.5 gap-y-1 border-t border-linha py-3.5">
          <span className="grid size-10 place-items-center rounded-full bg-areia text-tinta-suave">
            <UserPlus className="size-[19px]" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <p className="grid min-h-10 content-center text-[14.5px] leading-[1.45] text-tinta">Adicionar a primeira pessoa</p>
          {canAddGuests && (
            <div className="col-start-2 flex flex-wrap items-center gap-2">
              <Link href="/convidados" className={estiloDoBotaoPrimario}>
                <UserPlus className="size-[17px]" aria-hidden="true" />
                Adicionar convidado
              </Link>
              <Link href="/convidados" className="inline-flex min-h-11 items-center rounded-[8px] px-1 text-sm font-semibold text-ameixa underline-offset-4 hover:underline">
                Importar lista
              </Link>
            </div>
          )}
        </li>
        <li className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3.5 gap-y-1 border-t border-linha py-3.5 last:pb-0">
          <span className="grid size-10 place-items-center rounded-full bg-areia text-tinta-suave">
            <MessageCircle className="size-[19px]" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <p className="grid min-h-10 content-center text-[14.5px] leading-[1.45] text-tinta">Mandar o convite para ela</p>
          <div className="col-start-2">
            <button type="button" disabled className={estiloDoBotaoSecundario}>
              <MessageCircle className="size-[17px]" aria-hidden="true" />
              Enviar convite
            </button>
            <p className={`${classeDaDica} mt-1.5`}>Disponível depois que a primeira pessoa estiver na lista.</p>
          </div>
        </li>
      </ol>
    </BlocoDoPainel>
  );
}

/** Confirmações sem ninguém ainda: o que vai aparecer aqui, com uma amostra claramente marcada como exemplo. */
export function ConfirmacoesVazias({ className = "" }: { className?: string }) {
  return (
    <BlocoDoPainel id="confirmacoes" title="Confirmações de presença" className={className}>
      <div className="grid max-w-[60ch] gap-1.5">
        <b className="text-[15px] text-tinta">Ninguém respondeu ainda</b>
        <p className="text-pretty text-tinta-suave">
          Quando os convidados responderem pelo convite, vocês veem aqui quem vai, contado em convites (a quem cobrar a resposta) e em pessoas (para o buffet).
        </p>
      </div>
      <div role="group" aria-label="Exemplo de como o bloco fica com respostas" className="relative grid gap-3 rounded-[8px] border border-dashed border-linha-forte bg-areia/40 p-4 pt-5">
        <span className="absolute -top-3 left-3">
          <Etiqueta tone="neutro">Exemplo</Etiqueta>
        </span>
        <div className="grid grid-cols-3 gap-4 opacity-60" aria-hidden="true">
          {[
            ["Convites confirmados", "86", "de 140 convites"],
            ["Pessoas confirmadas", "151", "de 238 pessoas"],
            ["Sem resposta", "42", "convites"],
          ].map(([label, value, unit]) => (
            <div key={label} className="grid gap-1">
              <span className={classeDoRotulo}>{label}</span>
              <span className="text-[24px] font-semibold leading-[1.1] tabular-nums text-tinta md:text-[30px]">
                {value}
                <span className="mt-1 block text-[13px] font-medium text-tinta-suave md:text-sm">{unit}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="opacity-60">
          <MedidorDeProgresso
            height={10}
            label="Exemplo: 86 convites confirmados, 12 não vão e 42 sem resposta, de 140 convites"
            segments={[
              { value: 86, className: "bg-sucesso" },
              { value: 12, className: "bg-linha-forte" },
              { value: 42, className: "bg-areia" },
            ]}
          />
        </div>
      </div>
    </BlocoDoPainel>
  );
}
