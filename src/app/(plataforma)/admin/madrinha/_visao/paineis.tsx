import Link from "next/link";
import { CheckCircle2, Circle, Info, ShieldCheck } from "lucide-react";
import { AvatarDaLiz } from "@/components/liz/liz-illustration";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Painel } from "@/components/plataforma/panel";
import { Aviso, EtiquetaDeInativo } from "@/components/plataforma/notices";
import { CartaoDeIndicador, GradeDeIndicadores } from "@/components/plataforma/stat-card";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoDePausarALiz, InterruptorGeralDaLiz } from "../_components/interruptor-geral";

export function CabecalhoDaLiz({ ligada, pausada, temChave }: { ligada: boolean; pausada: boolean; temChave: boolean }) {
  return (
    <>
      <CabecalhoDaPagina
        eyebrow="Liz"
        title={
          <span className="flex items-center gap-3">
            <AvatarDaLiz size={56} decorative className="ring-2 ring-ameixa" />
            Liz
          </span>
        }
        description="A assistente do Aceito para os casais: só responde sobre casamento e sobre o Aceito."
        actions={<BotaoDePausarALiz ligada={ligada} pausada={pausada} />}
      />
      {ligada && !pausada ? null : (
        <Aviso tone="aviso" icon={Info} title={pausada ? "A Liz está pausada" : "A Liz está desligada"} aside={<EtiquetaDeInativo />}>
          {temChave ? "Os casais usam só o guia de ajuda. Ligue o interruptor geral quando as instruções e os tetos estiverem prontos." : "Falta a chave do Gemini (GEMINI_API_KEY) no servidor. Enquanto isso, os casais usam só o guia de ajuda."}
        </Aviso>
      )}
    </>
  );
}

export function PainelInterruptorGeral({ checklist, ligada, pausada, temChave }: { checklist: { label: string; done: boolean; text: string }[]; ligada: boolean; pausada: boolean; temChave: boolean }) {
  return (
    <Painel title="Interruptor geral">
      <InterruptorGeralDaLiz ligada={ligada} pausada={pausada} temChave={temChave} />
      <ul className="mt-2 divide-y divide-linha">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 py-3 text-[15px]">
            <span className="flex items-center gap-2.5 text-tinta">
              {item.done ? <CheckCircle2 className="size-5 text-sucesso" aria-hidden="true" /> : <Circle className="size-5 text-tinta-suave" aria-hidden="true" />}
              {item.label}
            </span>
            <span className="text-sm text-tinta-suave">{item.text}</span>
          </li>
        ))}
      </ul>
      <Link href="/admin/madrinha/controles" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm} mt-4`}>
        Editar instruções e conhecimento
      </Link>
    </Painel>
  );
}

export interface UsoDoMesDaLiz {
  perguntas: number;
  casais: number;
  foraDoAssunto: number;
  custoEmReais: number;
}

const emReais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PainelDeUsoDoMes({ uso, tetoEmCentavos }: { uso: UsoDoMesDaLiz; tetoEmCentavos: number }) {
  return (
    <Painel title="Uso e custo do mês">
      <GradeDeIndicadores cols={3}>
        <CartaoDeIndicador label="Perguntas ao Gemini" value={String(uso.perguntas)} hint={`${uso.casais} ${uso.casais === 1 ? "casal" : "casais"} no mês.`} />
        <CartaoDeIndicador label="Fora do assunto" value={String(uso.foraDoAssunto)} hint="Recusadas pela Liz." />
        <CartaoDeIndicador label="Custo estimado" value={emReais(uso.custoEmReais)} hint={`Teto do mês: ${emReais(tetoEmCentavos / 100)}.`} />
      </GradeDeIndicadores>
      <p className="mt-4 text-sm leading-5 text-tinta-suave">O custo é uma estimativa pelos tokens usados; a cobrança de verdade está no painel do Google. Não guardamos o texto das perguntas.</p>
    </Painel>
  );
}

export function PainelDeConsumo() {
  return (
    <Painel title="Assinantes, consumo e conversas recusadas">
      <EstadoVazio icon={ShieldCheck} compact title="Ainda não há o que mostrar">
        Aqui vão aparecer o consumo por casal, a receita e o custo por mês e as perguntas recusadas por fugir do tema, sem nomes, telefones nem e-mails. Ler uma conversa inteira exige o consentimento do casal.
      </EstadoVazio>
    </Painel>
  );
}
