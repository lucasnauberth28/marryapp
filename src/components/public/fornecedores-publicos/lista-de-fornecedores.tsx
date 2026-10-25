// A grade de fornecedores (ou o aviso de que nenhum combina com os filtros).
import Link from "next/link";
import { Building2, Check, MapPin, Sparkles, Star, Video } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { Aparicao } from "@/components/motion/reveal";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import { cn } from "@/lib/utils";
import { rotuloDasRegioes, type FornecedorPublico } from "./constantes";

function Capa({ fornecedor }: { fornecedor: FornecedorPublico }) {
  return (
    <Link href={`/fornecedores/${fornecedor.id}`} aria-label={`Ver perfil de ${fornecedor.companyName}`} tabIndex={-1} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-salvia-suave">
      {fornecedor.coverUrl ? (
        <ImagemDaPessoa src={fornecedor.coverUrl} alt="" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-sm text-tinta-suave">
          <Building2 className="size-10" aria-hidden="true" />
          Sem foto ainda
        </span>
      )}
    </Link>
  );
}

function Selos({ fornecedor }: { fornecedor: FornecedorPublico }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex min-h-7 items-center rounded-[6px] bg-salvia-suave px-3 text-sm font-semibold text-salvia">{fornecedor.category}</span>
      {fornecedor.isVerified ? (
        <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-sucesso-suave pl-2 pr-3 text-sm font-semibold text-sucesso">
          <Check className="size-4" aria-hidden="true" />
          Com curadoria
        </span>
      ) : null}
      {fornecedor.planTier === "MASTER" ? (
        <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-ameixa-suave pl-2 pr-3 text-sm font-semibold text-ameixa">
          <Sparkles className="size-4" aria-hidden="true" />
          Destaque
        </span>
      ) : null}
    </div>
  );
}

function Detalhes({ fornecedor }: { fornecedor: FornecedorPublico }) {
  const onde = rotuloDasRegioes(fornecedor.serviceRegions);
  return (
    <div className="flex flex-col gap-1 text-sm leading-5 text-tinta-suave">
      {onde ? <p className="flex items-center gap-2"><MapPin className="size-4 shrink-0" aria-hidden="true" />{onde}</p> : null}
      {fornecedor.reviewCount > 0 ? (
        <p className="flex items-center gap-2">
          <Star className="size-4 shrink-0 fill-champanhe text-champanhe" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-tinta">{fornecedor.rating.toFixed(1)}</strong>
            <span className="sr-only"> de 5 estrelas,</span> ({fornecedor.reviewCount}{" "}
            {fornecedor.reviewCount === 1 ? "avaliação" : "avaliações"})
          </span>
        </p>
      ) : null}
      {fornecedor.offersOnlineMeet ? <p className="flex items-center gap-2"><Video className="size-4 shrink-0" aria-hidden="true" />Atende por vídeo</p> : null}
    </div>
  );
}

function CartaoDoFornecedor({ fornecedor, posicao, aoPedirOrcamento }: { fornecedor: FornecedorPublico; posicao: number; aoPedirOrcamento: (f: FornecedorPublico) => void }) {
  const preco = fornecedor.startingPrice && fornecedor.startingPrice > 0 ? formatarReaisInteiros(fornecedor.startingPrice) : null;
  return (
    <Aparicao as="li" delay={(posicao % 3) * 90} className="flex">
      <article className="flex w-full flex-col gap-3">
        <Capa fornecedor={fornecedor} />
        <Selos fornecedor={fornecedor} />
        <h2 className="font-display text-[22px] font-medium leading-7 text-tinta ">
          <Link href={`/fornecedores/${fornecedor.id}`} className="hover:text-ameixa">{fornecedor.companyName}</Link>
        </h2>
        <Detalhes fornecedor={fornecedor} />
        {preco ? <p className="text-sm leading-5 text-tinta">A partir de <strong className="font-semibold">{preco}</strong></p> : null}
        {/* Ação principal: pedido de orçamento (registra o contato do casal) */}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <Link href={`/fornecedores/${fornecedor.id}`} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm)}>Ver perfil</Link>
          <button type="button" onClick={() => aoPedirOrcamento(fornecedor)} className={cn(estiloDoBotao.primary, estiloDoBotao.sm)}>Pedir orçamento</button>
        </div>
      </article>
    </Aparicao>
  );
}

function NenhumFornecedor({ comData, temFiltros, aoLimpar }: { comData: boolean; temFiltros: boolean; aoLimpar: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-[16px] border border-linha bg-papel px-6 py-12 text-center shadow-aceito-1">
      <Building2 className="size-10 text-tinta-suave" aria-hidden="true" />
      <h2 className="font-display text-[26px] font-medium leading-8 text-tinta">Nenhum fornecedor por aqui</h2>
      <p className="max-w-md text-base leading-6 text-tinta-suave">
        {comData ? "Ninguém com esses filtros está livre nessa data. Tente outra data ou mude os filtros." : "Tente outra região ou categoria para ver mais fornecedores."}
      </p>
      {temFiltros ? <button type="button" onClick={aoLimpar} className={cn(estiloDoBotao.secondary)}>Limpar filtros</button> : null}
    </div>
  );
}

interface ListaDeFornecedoresProps {
  fornecedores: FornecedorPublico[];
  trocandoData: boolean;
  comData: boolean;
  temFiltros: boolean;
  aoLimpar: () => void;
  aoPedirOrcamento: (f: FornecedorPublico) => void;
}

export function ListaDeFornecedores({ fornecedores, trocandoData, comData, temFiltros, aoLimpar, aoPedirOrcamento }: ListaDeFornecedoresProps) {
  if (fornecedores.length === 0) return <NenhumFornecedor comData={comData} temFiltros={temFiltros} aoLimpar={aoLimpar} />;
  return (
    <ul aria-busy={trocandoData || undefined} className={cn("grid grid-cols-1 gap-x-6 gap-y-10 transition-opacity sm:grid-cols-2 lg:grid-cols-3", trocandoData && "opacity-60")}>
      {fornecedores.map((f, i) => <CartaoDoFornecedor key={f.id} fornecedor={f} posicao={i} aoPedirOrcamento={aoPedirOrcamento} />)}
    </ul>
  );
}
