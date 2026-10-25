import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { pluralizar } from "@/lib/formatacao/plural";
import { LINK_DO_PLANO, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL } from "../../_lib/planos-do-fornecedor";

const BOTAO_PRINCIPAL = "inline-flex min-h-11 items-center gap-2 rounded-xl bg-ameixa px-4 text-[15px] font-semibold text-on-ameixa transition-colors hover:bg-ameixa-hover";

export function AvisoDoPerfilEmAnalise({ rejeitado }: { rejeitado: boolean }) {
  return (
    <Aparicao variant="up" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-linha bg-papel px-5 py-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <strong className="font-semibold">{rejeitado ? "O Aceito pediu ajustes no seu perfil" : "Seu perfil está em análise pelo Aceito"}</strong>
        <span className="text-sm text-tinta-suave">
          {rejeitado
            ? "Veja o recado, ajuste e salve: o perfil volta para a análise."
            : "Enquanto isso, complete o perfil com fotos, regiões e preço inicial. Perfis completos são aprovados mais rápido e só aparecem para os casais depois disso."}
        </span>
      </div>
      <Link href="/fornecedor/perfil" className={BOTAO_PRINCIPAL}>
        Completar o perfil
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </Aparicao>
  );
}

function textosDoLimite(monthLocked: number, used: number, remaining: number) {
  const limite = LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL;
  if (monthLocked > 0) {
    return {
      titulo: `${pluralizar(monthLocked, "pedido bloqueado", "pedidos bloqueados")} este mês`,
      texto: `Você usou os ${limite} pedidos do Plano Start. Assine o Pro para ver o contato desses casais e receber pedidos ilimitados.`,
    };
  }
  if (remaining > 0) return { titulo: `${used} de ${limite} pedidos usados este mês`, texto: "No Pro os pedidos são ilimitados e o casal fala com você direto no WhatsApp." };
  return { titulo: `Você usou os ${limite} pedidos do Plano Start este mês`, texto: "Os próximos pedidos deste mês chegam bloqueados. No Pro os pedidos são ilimitados." };
}

/** Plano Start: quantos pedidos já foram usados no mês e o convite ao Pro. */
export function AvisoDoPlanoInicial({ monthLocked, monthCount }: { monthLocked: number; monthCount: number }) {
  const used = Math.min(monthCount, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL);
  const { titulo, texto } = textosDoLimite(monthLocked, used, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL - used);
  return (
    // No celular a lista de pedidos vem primeiro e o convite ao Pro fecha a página, como no design.
    <Aparicao variant="up" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-salvia-suave px-5 py-4 max-md:order-last">
      <div className="flex min-w-0 flex-col gap-0.5">
        <strong className="font-semibold">{titulo}</strong>
        <span className="text-sm text-tinta-suave">{texto}</span>
      </div>
      <Link href={LINK_DO_PLANO} className={BOTAO_PRINCIPAL}>
        {monthLocked > 0 ? "Desbloquear com o Pro" : "Conhecer o Pro"}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </Aparicao>
  );
}
