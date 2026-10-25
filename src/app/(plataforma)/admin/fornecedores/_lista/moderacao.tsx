import { Flag, Star } from "lucide-react";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { haQuantoTempo } from "@/lib/platform/format";
import { obterAvaliacoesParaModerar } from "@/lib/platform/queries/fornecedores/detalhe";
import { ModeracaoDeAvaliacao } from "../_components/review-moderation";

type Moderacao = NonNullable<Awaited<ReturnType<typeof obterAvaliacoesParaModerar>>>;
type Avaliacao = Moderacao["reported"][number];

function BlocoDeAvaliacao({ review, now }: { review: Avaliacao; now: Date }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex flex-wrap items-center gap-x-2 text-[15px]">
        <strong className="font-semibold text-tinta">{review.vendorName}</strong>
        <span className="inline-flex items-center gap-1 font-semibold text-tinta">
          <Star className="size-4 fill-champanhe text-champanhe" aria-hidden="true" />
          {review.rating} de 5
        </span>
        <span className="text-tinta-suave">por {review.authorName}</span>
      </p>
      <p className="break-words text-[15px] text-tinta">“{review.comment}”</p>
      <p className="flex flex-wrap items-center gap-2 text-sm text-tinta-suave">
        {review.hiddenAt ? (
          <EtiquetaDeSituacao tone="neutro">Ocultada {haQuantoTempo(review.hiddenAt, now)}</EtiquetaDeSituacao>
        ) : (
          <EtiquetaDeSituacao tone="aviso" icon={Flag}>
            Denunciada
          </EtiquetaDeSituacao>
        )}
        {review.reportReason ? <span>Motivo do fornecedor: {review.reportReason}</span> : null}
      </p>
    </div>
  );
}

function ListaDeAvaliacoes({ reviews, hidden, now }: { reviews: Avaliacao[]; hidden: boolean; now: Date }) {
  return (
    <ul className="flex flex-col">
      {reviews.map((r) => (
        <li key={r.id} className={hidden ? "flex flex-col gap-3 border-b border-linha py-4 first:pt-0 last:border-b-0 last:pb-0" : "flex flex-col gap-3 border-b border-linha py-5 first:pt-0 last:border-b-0 last:pb-0"}>
          <BlocoDeAvaliacao review={r} now={now} />
          <ModeracaoDeAvaliacao reviewId={r.id} hidden={hidden} vendorName={r.vendorName} />
        </li>
      ))}
    </ul>
  );
}

export async function BlocoDeModeracao({ now }: { now: Date }) {
  const moderation = await obterAvaliacoesParaModerar();
  if (!moderation) return null;
  const { reported, hidden } = moderation;
  return (
    <Painel
      title="Avaliações denunciadas"
      aside={
        reported.length > 0 ? (
          <EtiquetaDeSituacao tone="aviso" icon={Flag}>
            {reported.length} para moderar
          </EtiquetaDeSituacao>
        ) : undefined
      }
    >
      {reported.length === 0 ? (
        <EstadoVazio icon={Flag} title="Nenhuma avaliação denunciada" compact>
          O fornecedor denuncia uma avaliação pela tela Avaliações do painel dele. Quando isso acontecer, ela aparece aqui para você decidir.
        </EstadoVazio>
      ) : (
        <ListaDeAvaliacoes reviews={reported} hidden={false} now={now} />
      )}
      {hidden.length > 0 ? (
        <div className="mt-6 border-t border-linha pt-5">
          <h3 className="mb-3 text-[15px] font-semibold text-tinta">Ocultadas recentemente</h3>
          <ListaDeAvaliacoes reviews={hidden} hidden now={now} />
        </div>
      ) : null}
    </Painel>
  );
}
