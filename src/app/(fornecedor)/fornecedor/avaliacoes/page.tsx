import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ShieldCheck, Star } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { getVendorPageContext } from "@/lib/security/vendor-guard";
import { Chip } from "../../_components/status-chip";
import { formatWeddingDate } from "../../_lib/vendor-panel";
import { ReviewReply } from "./review-reply";
import { Stars } from "./stars";

export const metadata: Metadata = { title: "Avaliações" };

const CARD = "rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]";
const OVERLINE = "text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase";
const PATH = "/fornecedor/avaliacoes";

type Filter = "sem-resposta" | "todas";

const SP_OFFSET_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3)

/** "5 out" (ano corrente) ou "5 out 2025", no horário de Brasília. */
function formatShortDate(date: Date, now: Date): string {
  const label = formatWeddingDate(new Date(date.getTime() - SP_OFFSET_MS)) ?? "";
  const sameYear =
    new Date(date.getTime() - SP_OFFSET_MS).getUTCFullYear() ===
    new Date(now.getTime() - SP_OFFSET_MS).getUTCFullYear();
  return sameYear ? label.replace(/ \d{4}$/, "") : label;
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

const oneDecimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default async function AvaliacoesPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { vendor } = await getVendorPageContext();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  // Todas as consultas filtram pelo fornecedor da sessão.
  const [byRating, unansweredCount] = await Promise.all([
    prisma.vendorReview.groupBy({ by: ["rating"], where: { vendorId: vendor.id }, _count: { _all: true } }),
    prisma.vendorReview.count({ where: { vendorId: vendor.id, reply: null } }),
  ]);

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: byRating.find((r) => r.rating === stars)?._count._all ?? 0,
  }));
  const total = byRating.reduce((acc, r) => acc + r._count._all, 0);
  const average = total > 0 ? byRating.reduce((acc, r) => acc + r.rating * r._count._all, 0) / total : 0;
  const averageLabel = oneDecimal.format(average);

  const { filtro } = await searchParams;
  // Sem filtro na URL: abre nas que pedem resposta, se houver alguma.
  const filter: Filter =
    filtro === "todas" || filtro === "sem-resposta" ? filtro : unansweredCount > 0 ? "sem-resposta" : "todas";

  const reviews =
    total > 0
      ? await prisma.vendorReview.findMany({
          where: { vendorId: vendor.id, ...(filter === "sem-resposta" ? { reply: null } : {}) },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            coupleNames: true,
            weddingDate: true,
            rating: true,
            comment: true,
            isVerified: true,
            reply: true,
            repliedAt: true,
            createdAt: true,
          },
        })
      : [];

  const now = new Date();
  const firstUnansweredId = reviews.find((r) => !r.reply)?.id;
  const publicProfileHref = vendor.curationStatus === "APPROVED" ? `/fornecedores/${vendor.id}` : null;

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "sem-resposta", label: "Sem resposta", count: unansweredCount },
    { value: "todas", label: "Todas", count: total },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Reveal variant="fade" className="flex flex-col gap-1">
        <p className={cn(OVERLINE, "hidden md:block")}>Fornecedor</p>
        <h1 className="font-display text-[32px] leading-[38px] font-medium md:text-[40px] md:leading-[46px]">
          Avaliações
        </h1>
        <p className="text-tinta-suave">
          Suas respostas aparecem no seu perfil público, logo abaixo de cada avaliação.
        </p>
      </Reveal>

      {total === 0 ? (
        <Reveal variant="fade" className={cn(CARD, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
          <span className="grid size-12 place-items-center rounded-full bg-salvia-suave text-salvia">
            <Star aria-hidden="true" className="size-6" />
          </span>
          <p className="text-lg font-semibold">Nenhuma avaliação por aqui ainda</p>
          <p className="max-w-md text-tinta-suave">
            Quando um casal avaliar seu trabalho no seu perfil público, a avaliação aparece aqui e você pode responder.
          </p>
          {publicProfileHref ? (
            <Link
              href={publicProfileHref}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-linha-forte bg-papel px-4 text-[15px] font-semibold text-tinta transition-colors hover:bg-areia"
            >
              Ver meu perfil público
              <ExternalLink aria-hidden="true" className="size-4" />
              <span className="sr-only">(abre em nova aba)</span>
            </Link>
          ) : null}
        </Reveal>
      ) : (
        <>
          <Reveal variant="up">
            <section
              aria-label="Resumo das avaliações"
              className={cn(CARD, "flex flex-wrap items-center gap-6 p-5 sm:gap-8 sm:p-6")}
            >
              <div className="flex min-w-[180px] flex-col gap-1.5">
                <span
                  className="font-display text-[56px] leading-[56px] sm:text-[64px] sm:leading-[64px]"
                  aria-hidden="true"
                >
                  {averageLabel}
                </span>
                <Stars rating={average} label={`Nota média ${averageLabel} de 5`} />
                <span className="text-sm text-tinta-suave">
                  {plural(total, "avaliação", "avaliações")} · {unansweredCount} sem resposta
                </span>
              </div>
              <ul aria-label="Distribuição das notas" className="flex min-w-0 flex-[1_1_280px] flex-col gap-2">
                {distribution.map(({ stars, count }) => (
                  <li key={stars} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2.5 text-sm">
                    <span>{plural(stars, "estrela", "estrelas")}</span>
                    <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-areia">
                      <span
                        className="block h-full rounded-full bg-champanhe"
                        style={{ width: `${Math.round((count / total) * 100)}%` }}
                      />
                    </span>
                    <span className="text-right tabular-nums text-tinta-suave">
                      {count}
                      <span className="sr-only"> {count === 1 ? "avaliação" : "avaliações"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <section aria-labelledby="lista-avaliacoes" className="flex flex-col gap-3">
            <h2 id="lista-avaliacoes" className="sr-only">
              {filter === "sem-resposta" ? "Avaliações sem resposta" : "Todas as avaliações"}
            </h2>
            <nav aria-label="Filtrar avaliações">
              <ul className="flex flex-wrap gap-2">
                {filters.map((f) => {
                  const active = f.value === filter;
                  return (
                    <li key={f.value}>
                      <Link
                        href={`${PATH}?filtro=${f.value}`}
                        aria-current={active ? "page" : undefined}
                        scroll={false}
                        className={cn(
                          "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                          active
                            ? "border-ameixa bg-ameixa-suave text-ameixa"
                            : "border-linha bg-papel text-tinta-suave hover:border-linha-forte hover:text-tinta",
                        )}
                      >
                        {f.label} · {f.count}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {reviews.length === 0 ? (
              <Reveal variant="fade" className={cn(CARD, "flex flex-col items-center gap-2 px-6 py-10 text-center")}>
                <p className="text-lg font-semibold">Tudo respondido</p>
                <p className="max-w-md text-tinta-suave">
                  Você já respondeu todas as avaliações. As respostas estão no seu perfil público.
                </p>
                <Link
                  href={`${PATH}?filtro=todas`}
                  scroll={false}
                  className="inline-flex min-h-11 items-center rounded-xl border border-linha-forte bg-papel px-4 text-[15px] font-semibold text-tinta transition-colors hover:bg-areia"
                >
                  Ver todas as avaliações
                </Link>
              </Reveal>
            ) : (
              <ul className="flex flex-col gap-3">
                {reviews.map((review, i) => {
                  const date = formatWeddingDate(review.weddingDate);
                  const married = review.weddingDate ? review.weddingDate.getTime() <= now.getTime() : false;
                  const subtitle = date
                    ? `${married ? "Casaram em" : "Casamento em"} ${date}`
                    : `Avaliou em ${formatShortDate(review.createdAt, now)}`;
                  return (
                    <Reveal as="li" key={review.id} variant="up" delay={Math.min(i, 5) * 80}>
                      <article
                        aria-labelledby={`avaliacao-${review.id}`}
                        className={cn(
                          CARD,
                          "flex flex-col gap-3 p-4 sm:p-6",
                          review.id === firstUnansweredId && "border-2 border-ameixa",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <h3 id={`avaliacao-${review.id}`} className="text-[17px] font-semibold break-words">
                              {review.coupleNames}
                            </h3>
                            <p className="text-sm text-tinta-suave">{subtitle}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {review.isVerified ? (
                              <Chip tone="sucesso" icon={ShieldCheck}>
                                Verificada
                              </Chip>
                            ) : null}
                            <Stars rating={review.rating} label={`${review.rating} de 5 estrelas`} />
                          </div>
                        </div>
                        <p className="font-display text-lg leading-7 whitespace-pre-line break-words italic sm:text-xl sm:leading-[30px]">
                          “{review.comment}”
                        </p>
                        <ReviewReply
                          reviewId={review.id}
                          coupleNames={review.coupleNames}
                          reply={review.reply}
                          repliedLabel={review.repliedAt ? formatShortDate(review.repliedAt, now) : null}
                          placeholder={
                            review.rating >= 4
                              ? "Agradeça e conte algo do dia que vocês lembram"
                              : "Agradeça o retorno e, se fizer sentido, explique o que aconteceu"
                          }
                        />
                      </article>
                    </Reveal>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
