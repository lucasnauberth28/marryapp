"use client";
// Meus cartões: os cartões do casal que aparecem como forma de pagamento ao lançar uma despesa.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { excluirCartaoDeCredito } from "@/actions/wallet-actions";
import { estiloDoBotao } from "@/components/landing/styles";
import { AvisoDoFormulario } from "@/components/ui/field";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { MAXIMO_DE_CARTOES_POR_CASAMENTO, rotuloDoCartao } from "@/lib/financas/cartoes";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { cn } from "@/lib/utils";
import { FormularioDoCartao } from "./formulario-do-cartao";
import type { CartaoCadastrado } from "./tipos";

function LinhaDoCartao({ cartao, aoEditar, aoExcluir }: { cartao: CartaoCadastrado; aoEditar: () => void; aoExcluir: () => void }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-linha bg-papel p-3 sm:p-4">
      <span aria-hidden="true" style={{ backgroundColor: cartao.color ?? "#18181b" }} className="grid size-11 shrink-0 place-items-center rounded-xl text-white">
        <CreditCard className="size-5" strokeWidth={1.6} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-tinta">{rotuloDoCartao(cartao)}</p>
        <p className="truncate text-sm text-tinta-suave">
          {cartao.brand}
          {cartao.limit > 0 ? ` · limite ${formatarReais(cartao.limit)}` : ""}
        </p>
      </div>
      <button type="button" onClick={aoEditar} aria-label={`Editar ${rotuloDoCartao(cartao)}`} className={cn(estiloDoBotao.quiet, "size-11 shrink-0 p-0")}>
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={aoExcluir} aria-label={`Excluir ${rotuloDoCartao(cartao)}`} className={cn(estiloDoBotao.quiet, "size-11 shrink-0 p-0 text-perigo")}>
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

/** O que a lista faz: abrir o formulário (novo ou de um cartão), pedir a confirmação e excluir. */
function useCartoes(cartoes: CartaoCadastrado[]) {
  const router = useRouter();
  // "novo" abre o formulário vazio; um id abre a edição daquele cartão
  const [formulario, setFormulario] = useState<"novo" | string | null>(null);
  const [aExcluir, setAExcluir] = useState<CartaoCadastrado | null>(null);
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();

  const concluir = () => {
    setFormulario(null);
    router.refresh();
  };
  const excluir = () => {
    const alvo = aExcluir;
    if (!alvo) return;
    startTransition(async () => {
      const res = await excluirCartaoDeCredito(alvo.id);
      setAExcluir(null);
      if (res.success) router.refresh();
      else setErro(res.error);
    });
  };
  return { formulario, setFormulario, aExcluir, setAExcluir, erro, isPending, concluir, excluir, editando: cartoes.find((c) => c.id === formulario) ?? null };
}

export function CartoesCliente({ cartoes }: { cartoes: CartaoCadastrado[] }) {
  const { formulario, setFormulario, aExcluir, setAExcluir, erro, isPending, concluir, excluir, editando } = useCartoes(cartoes);

  return (
    <div className="flex flex-col gap-3">
      {erro ? <AvisoDoFormulario>{erro}</AvisoDoFormulario> : null}
      {cartoes.length === 0 && formulario === null ? <p className="text-[15px] text-tinta-suave">Nenhum cartão ainda. Cadastre os que vocês usam e escolha o cartão ao lançar uma despesa.</p> : null}
      <ul className="flex flex-col gap-2">
        {cartoes.map((c) => (
          <LinhaDoCartao key={c.id} cartao={c} aoEditar={() => setFormulario(c.id)} aoExcluir={() => setAExcluir(c)} />
        ))}
      </ul>
      {formulario !== null ? (
        <FormularioDoCartao key={formulario} cartao={editando} aoConcluir={concluir} aoCancelar={() => setFormulario(null)} />
      ) : cartoes.length < MAXIMO_DE_CARTOES_POR_CASAMENTO ? (
        <div>
          <button type="button" onClick={() => setFormulario("novo")} className={cn(estiloDoBotao.secondary, "min-h-12")}>
            <Plus aria-hidden="true" className="size-4" />
            Adicionar cartão
          </button>
        </div>
      ) : null}
      <ModalDeConfirmacao
        isOpen={aExcluir !== null}
        onClose={() => setAExcluir(null)}
        onConfirm={excluir}
        isLoading={isPending}
        title="Excluir cartão"
        description={`Excluir ${aExcluir ? rotuloDoCartao(aExcluir) : "o cartão"}? As despesas já lançadas continuam como estão.`}
        confirmText="Excluir cartão"
      />
    </div>
  );
}
