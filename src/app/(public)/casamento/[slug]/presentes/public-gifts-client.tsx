"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Gift as GiftIcon, QrCode, Search, ShieldCheck } from "lucide-react";
import { btn } from "@/components/landing/styles";
import { GiftLocal as Gift } from "@/types/local";
import { UserImage } from "@/components/ui/user-image";
import { cn } from "@/lib/utils";

interface PublicGiftsClientProps {
  initialGifts: Gift[];
  coupleNames: string;
  /** Falso quando o cartão não está disponível: a tela só fala de Pix. */
  cardEnabled?: boolean;
}

type Sort = "default" | "asc" | "desc";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const moneyRound = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** "R$ 350" quando o valor é redondo, "R$ 350,50" quando não. */
function formatPrice(amount: number) {
  return amount % 100 === 0 ? moneyRound.format(amount / 100) : money.format(amount / 100);
}

const fieldClass =
  "min-h-11 rounded-[12px] border border-linha-forte bg-papel text-base leading-6 text-tinta transition-[border-color,box-shadow] duration-200 placeholder:text-tinta-suave/80 hover:border-tinta-suave focus:border-ameixa focus:shadow-[0_0_0_3px_var(--color-ameixa-suave)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa";

export function PublicGiftsClient({ initialGifts, coupleNames, cardEnabled = true }: PublicGiftsClientProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<Sort>("default");

  // Filtra e ordena a lista
  const q = search.trim().toLowerCase();
  const filteredGifts = initialGifts
    .filter((g) => g.title.toLowerCase().includes(q) || (g.description ? g.description.toLowerCase().includes(q) : false))
    .sort((a, b) => {
      if (sortBy === "asc") return a.amount - b.amount;
      if (sortBy === "desc") return b.amount - a.amount;
      return 0;
    });

  return (
    <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-16 sm:px-6">
      <section aria-labelledby="presentes-titulo" className="flex flex-col gap-3 pb-6 pt-8 sm:pt-14">
        <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">Lista de presentes</p>
        <h1
          id="presentes-titulo"
          className="font-display text-[36px] font-normal leading-[1.08] tracking-[-0.015em] text-balance text-tinta sm:text-[clamp(36px,4.5vw,56px)]"
        >
          Um carinho para a vida nova
        </h1>
        <p className="max-w-[60ch] text-[17px] leading-[26px] text-tinta-suave sm:text-lg sm:leading-7">
          A presença de vocês já é o nosso maior presente. Se quiserem nos ajudar a começar essa nova fase, escolham um item
          abaixo e paguem por Pix{cardEnabled ? " ou cartão" : ""}. {coupleNames} são avisados de quem presenteou.
        </p>
        <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-2 text-sm text-tinta-suave">
          <li className="flex items-center gap-1.5">
            <QrCode aria-hidden="true" className="size-4 text-sucesso" strokeWidth={1.75} />
            Pix sem taxa para quem presenteia
          </li>
          {cardEnabled ? (
            <li className="flex items-center gap-1.5">
              <CreditCard aria-hidden="true" className="size-4 text-ameixa" strokeWidth={1.75} />
              Cartão em até 12x
            </li>
          ) : null}
          <li className="flex items-center gap-1.5">
            <ShieldCheck aria-hidden="true" className="size-4 text-ameixa" strokeWidth={1.75} />
            Pagamento seguro
          </li>
        </ul>
      </section>

      {initialGifts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[16px] border border-linha bg-papel px-6 py-16 text-center">
          <GiftIcon aria-hidden="true" className="mb-1 size-10 text-tinta-suave" strokeWidth={1.5} />
          <p className="font-semibold text-tinta">A lista ainda está sendo preparada.</p>
          <p className="max-w-[40ch] text-sm text-tinta-suave">Os noivos ainda não cadastraram presentes. Volte em alguns dias.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 pb-6 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:w-[360px]">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-tinta-suave" strokeWidth={1.75} />
              <input
                type="search"
                aria-label="Buscar presente por nome"
                placeholder="Buscar presente por nome"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(fieldClass, "w-full pl-10 pr-4")}
              />
            </div>
            <select
              aria-label="Ordenar"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as Sort)}
              className={cn(fieldClass, "cursor-pointer px-4 sm:w-auto")}
            >
              <option value="default">Mais recentes</option>
              <option value="asc">Menor valor</option>
              <option value="desc">Maior valor</option>
            </select>
          </div>

          {filteredGifts.length === 0 ? (
            <div className="flex flex-col items-center gap-1 rounded-[16px] border border-linha bg-papel px-6 py-14 text-center">
              <p className="font-semibold text-tinta">Nenhum presente encontrado.</p>
              <p className="text-sm text-tinta-suave">Tente buscar por outro termo.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {filteredGifts.map((gift) => (
                <li key={gift.id}>
                  <article className="flex h-full flex-col gap-2">
                    <div className="relative aspect-square overflow-hidden rounded-[16px] bg-areia">
                      {gift.imageUrl ? (
                        <UserImage
                          src={gift.imageUrl}
                          alt=""
                          sizes="(min-width: 1024px) 262px, (min-width: 768px) 33vw, 50vw"
                          className="object-cover"
                        />
                      ) : (
                        <div aria-hidden="true" className="grid h-full place-items-center text-tinta-suave">
                          <GiftIcon className="size-8" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <h2 className="text-[15px] font-semibold leading-5 text-tinta sm:text-base sm:leading-6">{gift.title}</h2>
                    <p className="text-sm text-tinta-suave sm:text-base">{formatPrice(gift.amount)}</p>
                    {gift.description ? <p className="line-clamp-2 text-sm leading-5 text-tinta-suave">{gift.description}</p> : null}
                    <div className="mt-auto pt-1">
                      {gift.isPurchased ? (
                        <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-sucesso-suave px-3 text-sm font-semibold text-sucesso">
                          <Check aria-hidden="true" className="size-4" strokeWidth={2.25} />
                          Já foi presenteado
                        </span>
                      ) : (
                        <Link
                          href={`/checkout/${gift.id}`}
                          aria-label={`Presentear: ${gift.title}`}
                          className={cn(btn.secondary, btn.sm, btn.block)}
                        >
                          Presentear
                        </Link>
                      )}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
