import Link from "next/link";
import { Esqueleto } from "@/components/skeletons";
import { estiloDoBotao } from "@/components/landing/styles";
import { IlustracaoDaLiz } from "../liz-illustration";
import type { SituacaoDoCarregamento } from "./tipos";

export function CorpoDaDica({ load, onRetry, onNavigate }: { load: SituacaoDoCarregamento; onRetry: () => void; onNavigate: () => void }) {
  if (load.status === "loading")
    return (
      <div role="status" aria-busy="true" className="flex w-56 max-w-full flex-col gap-2">
        <span className="sr-only">Carregando a sugestão...</span>
        <Esqueleto className="h-4 w-full rounded-md" />
        <Esqueleto className="h-4 w-4/5 rounded-md" />
      </div>
    );
  if (load.status === "error")
    return (
      <div className="flex flex-col items-start gap-2">
        <p role="alert">{load.message}</p>
        <button type="button" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`} onClick={onRetry}>
          Tentar de novo
        </button>
      </div>
    );
  const tip = load.data.tip;
  if (!tip)
    return (
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-tinta-suave">Não vi nada pedindo atenção agora. Quando algo precisar de vocês, eu aviso aqui.</p>
        <IlustracaoDaLiz pose="tranquila" height={88} decorative className="h-[88px] w-auto shrink-0" />
      </div>
    );
  return (
    <div className="flex flex-col items-start gap-3">
      <p>{tip.text}</p>
      <Link href={tip.href} onClick={onNavigate} className={`${estiloDoBotao.primary} ${estiloDoBotao.sm}`}>
        {tip.action}
      </Link>
    </div>
  );
}
