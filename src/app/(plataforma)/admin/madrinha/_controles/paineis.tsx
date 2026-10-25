import Link from "next/link";
import { ChevronLeft, Info, Lock, Pause } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Painel } from "@/components/plataforma/panel";
import { Aviso, EtiquetaDeInativo } from "@/components/plataforma/notices";
import { estiloDoBotao } from "@/components/landing/styles";
import { Entrada } from "@/components/ui/input";

export function CabecalhoDosControles() {
  return (
    <>
      <CabecalhoDaPagina
        eyebrow="Liz"
        title="Comportamento e qualidade"
        description="Como a Liz fala, o que ela sabe e como você confere se está ajudando."
        actions={
          <Link href="/admin/madrinha" className={estiloDoBotao.secondary}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Voltar à gestão
          </Link>
        }
      />
      <Aviso tone="aviso" icon={Info} title="A Liz ainda não foi ativada" aside={<EtiquetaDeInativo />}>
        Você já pode escrever as instruções e a base de conhecimento. Não há conversas para medir a qualidade.
      </Aviso>
    </>
  );
}

export function PainelDoModelo() {
  return (
    <Painel title="Modelo">
      <p className="flex items-center gap-2 rounded-xl bg-areia p-3 text-[15px] font-semibold text-tinta">
        <Lock className="size-4 text-tinta-suave" aria-hidden="true" /> Ainda não definido
      </p>
      <p className="mt-3 text-sm leading-5 text-tinta-suave">O modelo será escolhido quando a conexão com a API for feita. Trocar de modelo muda o custo e o jeito de responder.</p>
    </Painel>
  );
}

export function SecaoDePausar() {
  return (
    <section aria-labelledby="pausar-t" className="flex flex-col gap-3 rounded-2xl border border-perigo/40 bg-papel p-5 shadow-[var(--shadow-aceito-1)] md:p-6">
      <h2 id="pausar-t" className="flex items-center gap-2 text-xl font-semibold leading-7 text-tinta">
        <Pause className="size-5 text-perigo" aria-hidden="true" /> Pausar a Liz para todos
      </h2>
      <p className="text-sm leading-5 text-tinta-suave">Para quando algo sair do controle: os casais veem um aviso gentil e a Liz descansa. Só dá para pausar depois que ela for ativada.</p>
      <Entrada label="Motivo (fica no registro)" disabled />
      <div>
        <button type="button" disabled className={`${estiloDoBotao.secondary} text-perigo`}>
          <Pause className="size-4" aria-hidden="true" /> Pausar para todos
        </button>
      </div>
    </section>
  );
}
