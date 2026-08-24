"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  Gift,
  Compass,
  Car,
  Navigation,
  Sparkles,
  Shirt,
  Hotel,
  Scissors,
  MessageSquare,
  Music,
  Send,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createGuestBookEntry } from "@/actions/site-builder-actions";
import { toast } from "sonner";

interface WeddingSiteViewProps {
  settings: any;
  storyItems: any[];
  tips: any[];
  guestbookEntries: any[];
  gifts: any[];
}

export function WeddingSiteView({
  settings,
  storyItems,
  tips,
  guestbookEntries,
  gifts,
}: WeddingSiteViewProps) {
  const [entries, setEntries] = useState(guestbookEntries);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const formattedWeddingDate = settings?.weddingDate
    ? format(new Date(settings.weddingDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "11 de Outubro de 2027";

  const paletteColors: string[] = settings?.dressCodePalette
    ? JSON.parse(settings.dressCodePalette)
    : ["#8C6D45", "#D4AF37", "#2C3E50", "#7D6B5D", "#E8D8C8"];

  const handleSendGuestbook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName || !message) {
      toast.error("Preencha seu nome e mensagem.");
      return;
    }

    startTransition(async () => {
      const res = await createGuestBookEntry({ authorName, message });
      if (res.success && res.entry) {
        setEntries((prev) => [res.entry, ...prev]);
        setAuthorName("");
        setMessage("");
        toast.success("Recado enviado com sucesso aos noivos! 💌");
      } else {
        toast.error("Erro ao enviar recado.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-serif antialiased selection:bg-[#8C6D45]/20 selection:text-[#8C6D45]">
      {/* ========================================================================= */}
      {/* 1. HERO CAPA COM FOTO & CONTAGEM */}
      {/* ========================================================================= */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden border-b border-stone-200">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#8C6D45]/10 flex items-center justify-center mb-8 border border-[#8C6D45]/30">
            <Heart className="w-8 h-8 text-[#8C6D45] fill-[#8C6D45]" />
          </div>

          <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-[#8C6D45] font-bold font-sans mb-3">
            Convidamos você para celebrar
          </p>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-stone-900 tracking-tight leading-none drop-shadow-xs">
            {settings?.title || "Lucas & Giovanna"}
          </h1>

          <p className="mt-4 text-base sm:text-xl text-stone-600 font-sans font-medium">
            {settings?.subtitle || "11 de Outubro de 2027 • São Paulo"}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-sans font-bold text-stone-700 mt-6 bg-white/80 backdrop-blur-md px-8 py-3.5 rounded-full border border-stone-200/80 shadow-xs">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8C6D45]" />
              {formattedWeddingDate}
            </span>
            <span className="w-1 h-1 bg-stone-300 rounded-full hidden sm:inline" />
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8C6D45]" />
              Cerimônia às {settings?.ceremonyTime || "16:30"}
            </span>
            <span className="w-1 h-1 bg-stone-300 rounded-full hidden sm:inline" />
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#8C6D45]" />
              {settings?.locationName || "Espaço Monte Castelo"}
            </span>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 font-sans">
            <Link href="/presentes">
              <Button className="bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full px-8 h-14 text-sm font-bold shadow-lg hover:shadow-xl transition-all gap-2">
                <Gift className="w-4 h-4" />
                Lista de Presentes
              </Button>
            </Link>
            <Link href="/rsvp">
              <Button
                variant="outline"
                className="border-stone-300 text-stone-800 hover:bg-white rounded-full px-8 h-14 text-sm font-bold shadow-xs"
              >
                Confirmar Presença
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. NOSSA HISTÓRIA (STORYTELLING) */}
      {/* ========================================================================= */}
      {settings?.showStory && (
        <section className="py-24 max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-[#8C6D45] font-bold font-sans">
              Nossa Trajetória
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mt-2">
              Como tudo começou...
            </h2>
            <p className="text-sm text-stone-600 font-sans mt-3">
              {settings?.welcomeMessage || "Um resumo dos momentos mais marcantes da nossa história de amor."}
            </p>
          </div>

          {storyItems.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-sans">
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm text-center">
                <span className="text-xs font-bold text-[#8C6D45] uppercase">2020</span>
                <h3 className="text-lg font-bold font-serif text-stone-900 mt-1">O Primeiro Olhar</h3>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  Nos conhecemos despretensiosamente através de amigos em comum e ali nascia uma linda conexão.
                </p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm text-center">
                <span className="text-xs font-bold text-[#8C6D45] uppercase">2022</span>
                <h3 className="text-lg font-bold font-serif text-stone-900 mt-1">Primeira Viagem Juntos</h3>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  Dias inesquecíveis que nos mostraram que éramos perfeitos um para o outro em qualquer lugar.
                </p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm text-center">
                <span className="text-xs font-bold text-[#8C6D45] uppercase">2024</span>
                <h3 className="text-lg font-bold font-serif text-stone-900 mt-1">O Pedido do 'Sim'</h3>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  Sob a luz do pôr do sol, fizemos a promessa de construirmos juntos uma vida inteira.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 font-sans">
              {storyItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-6 items-center"
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full md:w-56 h-48 object-cover rounded-2xl shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    {item.dateLabel && (
                      <span className="text-xs font-bold text-[#8C6D45] uppercase tracking-wider">
                        {item.dateLabel}
                      </span>
                    )}
                    <h3 className="text-2xl font-bold font-serif text-stone-900 mt-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. CERIMÔNIA, RECEPÇÃO & LOCALIZAÇÃO (WAZE & UBER) */}
      {/* ========================================================================= */}
      {settings?.showLocation && (
        <section className="py-24 bg-white border-y border-stone-200">
          <div className="max-w-5xl mx-auto px-6 font-sans">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest text-[#8C6D45] font-bold">
                Local & Horários
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 mt-2">
                Onde Celebraremos
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-stone-200/80 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#8C6D45]/10 text-[#8C6D45] flex items-center justify-center mb-6">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif text-stone-900">
                    {settings?.locationName || "Espaço Monte Castelo"}
                  </h3>
                  <p className="text-sm text-stone-600 mt-2">
                    {settings?.locationAddress || "Rua das Flores, 1200 - São Paulo, SP"}
                  </p>

                  <div className="mt-6 pt-6 border-t border-stone-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-700 font-semibold">
                      <span>Início da Cerimônia:</span>
                      <span className="text-stone-900 font-bold">{settings?.ceremonyTime || "16:30"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-stone-700 font-semibold">
                      <span>Início da Recepção & Festa:</span>
                      <span className="text-stone-900 font-bold">{settings?.receptionTime || "18:30"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <a
                    href={settings?.wazeUrl || "https://waze.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl h-12 gap-2 border-stone-300 font-bold text-xs"
                    >
                      <Navigation className="w-4 h-4 text-blue-600" />
                      Abrir no Waze
                    </Button>
                  </a>
                  <a
                    href={settings?.uberUrl || "https://m.uber.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl h-12 gap-2 border-stone-300 font-bold text-xs"
                    >
                      <Car className="w-4 h-4 text-stone-900" />
                      Chamar Uber
                    </Button>
                  </a>
                </div>
              </div>

              {/* Informações Extras de Acesso */}
              <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-stone-200/80 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif text-stone-900">
                    Estacionamento & Recepção
                  </h3>
                  <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                    O local conta com serviço de valet gratuito na entrada para todos os convidados. Pedimos a gentileza de chegarem com 20 minutos de antecedência.
                  </p>
                </div>

                <div className="mt-8 p-4 bg-white rounded-2xl border border-stone-200 text-xs text-stone-600">
                  <p className="font-bold text-stone-900">Dica de Chegada:</p>
                  <p className="mt-1">
                    Acesso facilitado pela rodovia principal com placas indicativas do casamento até a entrada do salão.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. DRESS CODE & PALETA DE CORES */}
      {/* ========================================================================= */}
      {settings?.showDressCode && (
        <section className="py-24 max-w-5xl mx-auto px-6 font-sans">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-[#8C6D45] font-bold">
              Guia de Estilo
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 mt-2">
              {settings?.dressCodeTitle || "Traje Passeio Completo"}
            </h2>
            <p className="text-sm text-stone-600 mt-3 leading-relaxed">
              {settings?.dressCodeDesc || "Pedimos gentilmente que evitem tons de branco, off-white e nude reservados exclusivamente à noiva."}
            </p>

            {/* Paleta de Cores Recomendada */}
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                Paleta de Cores em Harmonia com o Evento
              </p>
              <div className="flex items-center justify-center gap-3">
                {paletteColors.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 rounded-full shadow-md border-2 border-white ring-1 ring-stone-200"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. MURAL DE RECADOS DOS CONVIDADOS (GUESTBOOK) */}
      {/* ========================================================================= */}
      {settings?.showGuestbook && (
        <section className="py-24 bg-white border-t border-stone-200 font-sans">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest text-[#8C6D45] font-bold">
                Carinho em Palavras
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 mt-2">
                Mural de Recados
              </h2>
              <p className="text-sm text-stone-600 mt-2">
                Deixe uma mensagem especial para os noivos guardarem para sempre.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
              {/* Formulário de Envio */}
              <form
                onSubmit={handleSendGuestbook}
                className="bg-[#FAF8F5] p-8 rounded-3xl border border-stone-200 space-y-4 shadow-sm"
              >
                <h3 className="font-serif font-bold text-xl text-stone-900">
                  Escrever para os Noivos
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 uppercase">Seu Nome</label>
                  <Input
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ex: Padrinho Rodrigo e Carol"
                    className="bg-white border-stone-200 rounded-2xl h-12"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 uppercase">Sua Mensagem</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Desejamos toda a felicidade do mundo para essa nova etapa..."
                    rows={4}
                    className="bg-white border-stone-200 rounded-2xl"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full h-12 font-bold gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Recado com Carinho</span>
                </Button>
              </form>

              {/* Feed de Recados */}
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
                {entries.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAF8F5] rounded-3xl border border-stone-200 text-stone-400 text-xs">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Seja o primeiro a deixar uma mensagem no mural dos noivos!
                  </div>
                ) : (
                  entries.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 bg-[#FAF8F5] rounded-2xl border border-stone-200 shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-stone-900">{item.authorName}</span>
                        <span className="text-[10px] text-stone-400">
                          {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 italic font-serif leading-relaxed">
                        "{item.message}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. VITRINE DE PRESENTES EMBUTIDA */}
      {/* ========================================================================= */}
      {settings?.showGifts && gifts.length > 0 && (
        <section className="py-24 max-w-6xl mx-auto px-6 font-sans">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-[#8C6D45] font-bold">
              Lista dos Noivos
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 mt-2">
              Presentes de Casamento
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              Sua presença é nosso maior presente. Se desejar nos presentear, confira alguns itens:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {gifts.slice(0, 6).map((gift) => (
              <div
                key={gift.id}
                className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between p-5 hover:shadow-md transition-all"
              >
                <div>
                  {gift.imageUrl && (
                    <img
                      src={gift.imageUrl}
                      alt={gift.title}
                      className="w-full h-44 object-cover rounded-2xl mb-4"
                    />
                  )}
                  <h3 className="font-bold text-base text-stone-900 font-serif line-clamp-1">
                    {gift.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                    {gift.description || "Contribuição para a nossa celebração."}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="font-extrabold text-base text-stone-900">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      gift.amount / 100
                    )}
                  </span>
                  <Link href={`/checkout/${gift.id}`}>
                    <Button className="bg-[#8C6D45] hover:bg-[#785c39] text-white text-xs font-bold rounded-full h-9 px-4">
                      Presentear
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/presentes">
              <Button
                variant="outline"
                className="rounded-full px-8 h-12 font-bold text-xs border-stone-300 gap-2"
              >
                <span>Ver Todos os Presentes da Lista</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. FOOTER DO CASAMENTO */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-stone-200 py-10 font-sans text-center text-xs text-stone-400">
        <p className="font-serif italic text-base text-stone-700 mb-1">
          {settings?.title || "Lucas & Giovanna"}
        </p>
        <p>11 de Outubro de 2027 • Feito com amor com MarryApp</p>
      </footer>
    </div>
  );
}
