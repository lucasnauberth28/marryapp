"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { GiftLocal as Gift } from "@/types/local";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Gift as GiftIcon,
  Heart,
  ImageOff,
  Search,
  ArrowRight,
  Eye,
  CheckCircle2,
  Sparkles,
  X,
  ShieldCheck,
  CreditCard,
  QrCode,
  Tag
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface PublicGiftsClientProps {
  initialGifts: Gift[];
  coupleNames: string;
}

export function PublicGiftsClient({ initialGifts, coupleNames }: PublicGiftsClientProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "asc" | "desc">("default");
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);

  function formatPrice(amount: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount / 100);
  }

  // Filtra e ordena a lista
  const filteredGifts = initialGifts
    .filter((g) => {
      const q = search.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "asc") return a.amount - b.amount;
      if (sortBy === "desc") return b.amount - a.amount;
      return 0;
    });

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Hero Section Minimalista e Sem Borda */}
      <div className="text-center max-w-xl mx-auto py-2 space-y-2">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
          <Heart className="w-5 h-5 fill-primary text-primary" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Lista de presentes</p>
        <h1 className="font-display text-4xl text-tinta tracking-tight text-balance">{coupleNames}</h1>
        <p className="text-sm text-tinta-suave max-w-md mx-auto leading-relaxed">
          Sua presença é o nosso maior presente. Se quiser nos ajudar a começar essa nova fase, escolha um item abaixo.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-semibold text-tinta-suave">
          <span className="flex items-center gap-1 text-tinta-suave bg-papel/80 px-2.5 py-1 rounded-full border border-linha/60 shadow-2xs">
            <QrCode className="w-3 h-3 text-sucesso" /> PIX Copia e Cola (Sem Taxas)
          </span>
          <span className="flex items-center gap-1 text-tinta-suave bg-papel/80 px-2.5 py-1 rounded-full border border-linha/60 shadow-2xs">
            <CreditCard className="w-3 h-3 text-indigo-600" /> Cartão de Crédito até 12x
          </span>
          <span className="flex items-center gap-1 text-tinta-suave bg-papel/80 px-2.5 py-1 rounded-full border border-linha/60 shadow-2xs">
            <ShieldCheck className="w-3 h-3 text-primary" /> Checkout Seguro
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto w-full bg-papel p-3 rounded-2xl border border-linha/80 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-tinta-suave absolute left-3.5 top-3" />
          <Input
            placeholder="Buscar presente por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-linha text-sm h-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          <span className="text-tinta-suave font-semibold text-xs whitespace-nowrap">Ordenar por:</span>
          <button
            onClick={() => setSortBy("default")}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              sortBy === "default"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-areia text-tinta-suave hover:bg-areia"
            }`}
          >
            Destaques
          </button>
          <button
            onClick={() => setSortBy("asc")}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              sortBy === "asc"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-areia text-tinta-suave hover:bg-areia"
            }`}
          >
            Menor Valor
          </button>
          <button
            onClick={() => setSortBy("desc")}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              sortBy === "desc"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-areia text-tinta-suave hover:bg-areia"
            }`}
          >
            Maior Valor
          </button>
        </div>
      </div>

      {/* Grid de Presentes */}
      {filteredGifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-papel border border-linha/80 rounded-3xl text-tinta-suave max-w-6xl mx-auto w-full">
          <GiftIcon className="w-12 h-12 mb-3 text-linha-forte stroke-[1.5]" />
          <p className="font-bold text-tinta-suave text-base">Nenhum presente encontrado.</p>
          <p className="text-xs text-tinta-suave mt-1">Tente buscar por outro termo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
          {filteredGifts.map((gift, index) => (
            <Reveal key={gift.id} delay={(index % 3) * 90} className="flex">
            <div
              onClick={() => setSelectedGift(gift)}
              className={`bg-papel rounded-3xl border border-linha/80 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 flex w-full flex-col justify-between cursor-pointer group relative overflow-hidden ${
                gift.isPurchased ? "opacity-75 bg-linho/80" : ""
              }`}
            >
              {/* Imagem do Presente */}
              <div className="h-56 bg-areia relative overflow-hidden flex items-center justify-center">
                {gift.imageUrl ? (
                  <img
                    src={gift.imageUrl}
                    alt={gift.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-tinta-suave">
                    <ImageOff className="w-8 h-8 text-linha-forte mb-2" />
                    <span className="text-xs text-tinta-suave font-medium">Lembrança Especial</span>
                  </div>
                )}

                {/* Badge de "Já Presenteado" ou "Ver Detalhes" */}
                {gift.isPurchased ? (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                    <span className="bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                      <CheckCircle2 className="w-4 h-4" /> Já Presenteado
                    </span>
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-papel/90 backdrop-blur-md text-tinta text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-primary" /> Ver Detalhes
                    </span>
                  </div>
                )}
              </div>

              {/* Informações do Presente */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-tinta group-hover:text-primary transition-colors line-clamp-1">
                    {gift.title}
                  </h3>
                  <p className="text-xs text-tinta-suave mt-1.5 line-clamp-2 leading-relaxed">
                    {gift.description || "Ajude os noivos com essa lembrança inesquecível para o novo lar."}
                  </p>
                </div>

                <div className="pt-4 border-t border-linha flex items-center justify-between">
                  <div>
                    <span className="text-xs text-tinta-suave uppercase tracking-wider font-bold block">
                      Valor Sugerido
                    </span>
                    <span className="text-xl font-extrabold text-tinta">
                      {formatPrice(gift.amount)}
                    </span>
                  </div>

                  {gift.isPurchased ? (
                    <Button
                      disabled
                      size="sm"
                      className="rounded-xl px-4 text-xs font-bold bg-areia text-tinta-suave border border-linha cursor-not-allowed"
                    >
                      Presenteado
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGift(gift);
                      }}
                      className="rounded-xl px-4 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <span>Ver Presente</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      )}

      {/* MODAL PREMIUM DE DETALHES E VISUALIZAÇÃO DO PRESENTE (PROPORÇÃO 60/40) */}
      <Dialog open={!!selectedGift} onOpenChange={(open) => !open && setSelectedGift(null)}>
        <DialogContent className="!max-w-5xl w-[94vw] sm:w-[90vw] p-0 overflow-hidden rounded-[28px] border-linha shadow-2xl bg-papel max-h-[82vh]">
          {selectedGift && (
            <div className="flex flex-col md:flex-row min-h-[360px] md:min-h-[400px]">
              {/* Lado Esquerdo: Imagem do Presente (60% da Largura) */}
              <div className="md:w-[60%] bg-linho border-b md:border-b-0 md:border-r border-linha relative min-h-[220px] md:min-h-[380px] max-h-[380px] flex items-center justify-center p-4 overflow-hidden">
                {selectedGift.imageUrl ? (
                  <img
                    src={selectedGift.imageUrl}
                    alt={selectedGift.title}
                    className="w-full h-full max-h-[340px] object-contain rounded-xl drop-shadow-xs transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-tinta-suave p-6 text-center">
                    <GiftIcon className="w-12 h-12 text-linha-forte mb-2 stroke-[1.2]" />
                    <span className="text-xs text-tinta-suave font-semibold">Lembrança Especial para o Novo Lar</span>
                  </div>
                )}

                {selectedGift.isPurchased && (
                  <div className="absolute inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 text-center">
                    <span className="bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Este presente já foi oferecido
                    </span>
                  </div>
                )}
              </div>

              {/* Lado Direito: Detalhes & Ação (40% da Largura) */}
              <div className="md:w-[40%] p-5 sm:p-6 flex flex-col justify-between space-y-4 bg-papel overflow-y-auto max-h-[82vh]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary" aria-hidden="true" /> {coupleNames}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl text-tinta tracking-tight font-display italic leading-snug">
                      {selectedGift.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-tinta-suave mt-2 leading-relaxed">
                      {selectedGift.description ||
                        "Sua contribuição com este presente tornará a nossa nova vida juntos ainda mais especial e cheia de carinho!"}
                    </p>
                  </div>

                  {/* Card de Valor da Contribuição */}
                  <div className="bg-primary/5 p-3.5 rounded-xl border border-primary/20 space-y-0.5 mt-2 shadow-2xs">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-primary block">
                      Valor da Contribuição
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-tinta tracking-tight block">
                      {formatPrice(selectedGift.amount)}
                    </span>
                    <p className="text-xs text-tinta-suave flex items-center gap-1 pt-0.5 font-medium">
                      <ShieldCheck className="w-3 h-3 text-sucesso" /> PIX ou Cartão em até 12x
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {selectedGift.isPurchased ? (
                    <Button disabled className="w-full rounded-xl py-3 text-xs font-bold bg-areia text-tinta-suave border border-linha cursor-not-allowed">
                      Presente Já Comprado
                    </Button>
                  ) : (
                    <Link href={`/checkout/${selectedGift.id}`} className="block w-full">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 px-4 text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all">
                        <span>Presentear Agora</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => setSelectedGift(null)}
                    className="w-full text-xs font-semibold text-tinta-suave hover:text-tinta rounded-lg h-8"
                  >
                    Voltar para a lista
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
