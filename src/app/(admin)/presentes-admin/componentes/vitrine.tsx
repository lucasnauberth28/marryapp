import { ImageOff, Trash2 } from "lucide-react";
import { estiloDoCartao, estiloDoTituloDoCartao } from "@/components/casal/ui";
import { estiloDoBotao } from "@/components/landing/styles";
import { IlustracaoDaLiz } from "@/components/liz/liz-illustration";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { formatarReaisEnxuto } from "@/lib/formatacao/dinheiro";
import type { PresenteLocal } from "@/types/local";

function VitrineVazia({ aoCadastrar }: { aoCadastrar: () => void }) {
  return (
    <div className={`${estiloDoCartao} flex flex-col items-center justify-center px-4 pb-16 pt-8 text-center`}>
      {/* Vitrine vazia: a Liz tranquila (decorativa); a área de valores recebidos fica sem ela */}
      <IlustracaoDaLiz pose="tranquila" height={104} decorative className="mb-3 h-[104px] w-auto" />
      <p className="font-semibold text-tinta">Vocês ainda não cadastraram presentes</p>
      <p className="mt-1 max-w-xs text-sm text-tinta-suave">Cadastrem o primeiro com nome e valor em reais. Pode ser um item da casa ou uma cota da lua de mel.</p>
      <button type="button" onClick={aoCadastrar} className={`${estiloDoBotao.primary} mt-5`}>
        Cadastrar o primeiro presente
      </button>
    </div>
  );
}

interface PropriedadesDoCartaoDoPresente {
  gift: PresenteLocal;
  excluindo: boolean;
  ocupado: boolean;
  aoExcluir: (id: string) => void;
}

function CartaoDoPresente({ gift, excluindo, ocupado, aoExcluir }: PropriedadesDoCartaoDoPresente) {
  return (
    <li className={`${estiloDoCartao} flex flex-col gap-2 p-3`}>
      <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-areia text-xs text-tinta-suave">
        {gift.imageUrl ? (
          <ImagemDaPessoa src={gift.imageUrl} alt="" sizes="(min-width: 640px) 180px, 50vw" className="object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1">
            <ImageOff className="size-6" aria-hidden="true" />
            Sem foto
          </span>
        )}
      </div>
      <strong className="line-clamp-2 text-[15px] font-semibold leading-5 text-tinta">{gift.title}</strong>
      {gift.isPurchased ? (
        <span className="text-sm font-semibold text-sucesso">Presenteado · {formatarReaisEnxuto(gift.amount)}</span>
      ) : (
        <span className="text-sm text-tinta-suave">{formatarReaisEnxuto(gift.amount)} · disponível</span>
      )}
      {!gift.isPurchased && (
        <BotaoComCarregamento
          aria-label={`Excluir ${gift.title}`}
          onClick={() => aoExcluir(gift.id)}
          loading={excluindo}
          disabled={ocupado}
          className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm} self-start text-perigo hover:bg-perigo-suave`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Excluir
        </BotaoComCarregamento>
      )}
    </li>
  );
}

interface PropriedadesDaVitrine {
  gifts: PresenteLocal[];
  deletingId: string | null;
  isPending: boolean;
  aoCadastrar: () => void;
  aoExcluir: (id: string) => void;
}

export function Vitrine({ gifts, deletingId, isPending, aoCadastrar, aoExcluir }: PropriedadesDaVitrine) {
  return (
    <section aria-labelledby="vitrine-titulo" className="flex flex-col gap-3">
      <h2 id="vitrine-titulo" className={estiloDoTituloDoCartao}>
        Presentes no site · {gifts.length}
      </h2>
      {gifts.length === 0 ? (
        <VitrineVazia aoCadastrar={aoCadastrar} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-4">
          {gifts.map((gift) => (
            <CartaoDoPresente key={gift.id} gift={gift} excluindo={isPending && deletingId === gift.id} ocupado={isPending} aoExcluir={aoExcluir} />
          ))}
        </ul>
      )}
    </section>
  );
}
