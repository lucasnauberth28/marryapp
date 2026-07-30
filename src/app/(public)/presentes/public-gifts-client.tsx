"use client";

import { useState } from "react";
import Link from "next/link";
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
}

export function PublicGiftsClient({ initialGifts }: PublicGiftsClientProps) {
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
      {/* Hero Section Compacta e Sutil (Não-Fixada) */}
      <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border border-amber-200/60 rounded-3xl p-8 text-center max-w-3xl mx-auto shadow-sm relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-amber-100/80 border border-amber-300/60 text-amber-800 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Heart className="w-6 h-6 fill-amber-700 text-amber-700" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif italic text-zinc-900 tracking-tight">
          Lista de Presentes de Casamento
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 mt-2 max-w-xl mx-auto leading-relaxed">
          Sua presença é nosso maior presente! Se desejar nos apoiar no início desta nova jornada juntos, escolha uma das lembranças abaixo.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-amber-200/50 text-xs font-semibold text-zinc-500">
          <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-zinc-200 shadow-2xs">
            <QrCode className="w-3.5 h-3.5 text-emerald-600" /> PIX Copia e Cola (Sem Taxas)
          </span>
          <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-zinc-200 shadow-2xs">
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Cartão de Crédito em até 12x
          </span>
          <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-zinc-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Checkout Seguro
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto w-full bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <Input
            placeholder="Buscar presente por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-zinc-200 text-sm h-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          <span className="text-zinc-400 font-semibold text-[11px] whitespace-nowrap">Ordenar por:</span>
          <button
            onClick={() => setSortBy("default")}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              sortBy === "default"
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Destaques
          </button>
          <button
            onClick={() => setSortBy("asc")}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              sortBy === "asc"
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Menor Valor
          </button>
          <button
            onClick={() => setSortBy("desc")}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              sortBy === "desc"
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Maior Valor
          </button>
        </div>
      </div>

      {/* Grid de Presentes */}
      {filteredGifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-zinc-200/80 rounded-3xl text-zinc-400 max-w-6xl mx-auto w-full">
          <GiftIcon className="w-12 h-12 mb-3 text-zinc-300 stroke-[1.5]" />
          <p className="font-bold text-zinc-700 text-base">Nenhum presente encontrado.</p>
          <p className="text-xs text-zinc-400 mt-1">Tente buscar por outro termo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
          {filteredGifts.map((gift) => (
            <div
              key={gift.id}
              onClick={() => setSelectedGift(gift)}
              className={`bg-white rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-amber-300 transition-all duration-300 flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                gift.isPurchased ? "opacity-75 bg-zinc-50/80" : ""
              }`}
            >
              {/* Imagem do Presente */}
              <div className="h-56 bg-zinc-100 relative overflow-hidden flex items-center justify-center">
                {gift.imageUrl ? (
                  <img
                    src={gift.imageUrl}
                    alt={gift.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <ImageOff className="w-8 h-8 text-zinc-300 mb-2" />
                    <span className="text-xs text-zinc-400 font-medium">Lembrança Especial</span>
                  </div>
                )}

                {/* Badge de "Já Presenteado" ou "Ver Detalhes" */}
                {gift.isPurchased ? (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                    <span className="bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                      <CheckCircle2 className="w-4 h-4" /> Já Presenteado
                    </span>
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white/90 backdrop-blur-md text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-amber-700" /> Ver Detalhes
                    </span>
                  </div>
                )}
              </div>

              {/* Informações do Presente */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                    {gift.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {gift.description || "Ajude os noivos com essa lembrança inesquecível para o novo lar."}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
                      Valor Sugerido
                    </span>
                    <span className="text-xl font-extrabold text-zinc-900">
                      {formatPrice(gift.amount)}
                    </span>
                  </div>

                  {gift.isPurchased ? (
                    <Button
                      disabled
                      size="sm"
                      className="rounded-xl px-4 text-xs font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
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
                      className="rounded-xl px-4 text-xs font-bold bg-zinc-900 hover:bg-amber-900 text-white shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <span>Ver Presente</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL PREMIUM DE DETALHES E VISUALIZAÇÃO DO PRESENTE */}
      <Dialog open={!!selectedGift} onOpenChange={(open) => !open && setSelectedGift(null)}>
        <DialogContent className="max-w-4xl w-[92vw] p-0 overflow-hidden rounded-[32px] border-zinc-200 shadow-2xl bg-white">
          {selectedGift && (
            <div className="flex flex-col md:flex-row min-h-[460px]">
              {/* Lado Esquerdo: Imagem do Presente em Proporção Ampla */}
              <div className="md:w-[48%] bg-zinc-50 border-b md:border-b-0 md:border-r border-zinc-100 relative min-h-[280px] md:min-h-[460px] flex items-center justify-center p-6 overflow-hidden">
                {selectedGift.imageUrl ? (
                  <img
                    src={selectedGift.imageUrl}
                    alt={selectedGift.title}
                    className="w-full h-full max-h-[380px] object-contain rounded-2xl drop-shadow-xs transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
                    <GiftIcon className="w-14 h-14 text-zinc-300 mb-3 stroke-[1.2]" />
                    <span className="text-sm text-zinc-500 font-semibold">Lembrança Especial para o Novo Lar</span>
                  </div>
                )}

                {selectedGift.isPurchased && (
                  <div className="absolute inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-6 text-center">
                    <span className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Este presente já foi oferecido
                    </span>
                  </div>
                )}
              </div>

              {/* Lado Direito: Detalhes & Ação */}
              <div className="md:w-[52%] p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-white">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200/80 inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Casamento Lucas & Giovanna
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight font-serif italic leading-snug">
                      {selectedGift.title}
                    </h2>

                    <p className="text-sm sm:text-base text-zinc-600 mt-3 leading-relaxed">
                      {selectedGift.description ||
                        "Sua contribuição com este presente tornará a nossa nova vida juntos ainda mais especial e cheia de carinho!"}
                    </p>
                  </div>

                  {/* Card de Valor da Contribuição */}
                  <div className="bg-gradient-to-br from-amber-50/80 to-amber-100/40 p-5 rounded-2xl border border-amber-200/60 space-y-1 mt-4 shadow-2xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900/70 block">
                      Valor da Contribuição
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight block">
                      {formatPrice(selectedGift.amount)}
                    </span>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 pt-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> PIX ou Cartão em até 12x
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {selectedGift.isPurchased ? (
                    <Button disabled className="w-full rounded-2xl py-6 text-sm font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed">
                      Presente Já Comprado
                    </Button>
                  ) : (
                    <Link href={`/checkout/${selectedGift.id}`} className="block w-full">
                      <Button className="w-full bg-gradient-to-r from-amber-700 via-amber-800 to-zinc-900 hover:from-amber-800 hover:to-zinc-800 text-white rounded-2xl py-6 text-base font-bold shadow-xl shadow-amber-900/10 flex items-center justify-center gap-2 transition-all">
                        <span>Presentear Agora</span>
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => setSelectedGift(null)}
                    className="w-full text-xs font-semibold text-zinc-500 hover:text-zinc-900 rounded-xl"
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
