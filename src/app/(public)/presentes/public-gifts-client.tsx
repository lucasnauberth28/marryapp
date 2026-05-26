import Link from "next/link"
import { GiftLocal as Gift } from "@/types/local"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift as GiftIcon, Heart, ImageOff } from "lucide-react"

interface PublicGiftsClientProps {
  initialGifts: Gift[]
}

export function PublicGiftsClient({ initialGifts }: PublicGiftsClientProps) {
  function formatPrice(amount: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100)
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center justify-center p-2 bg-pink-50 rounded-full text-pink-600 mb-2">
          <Heart className="w-5 h-5 fill-pink-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight sm:text-5xl">
          Lista de Presentes
        </h1>
        <p className="text-lg text-zinc-500">
          Queridos amigos e familiares, a presença de vocês é o nosso maior presente! Se desejarem nos ajudar a começar essa nova jornada juntos, escolham um dos itens abaixo. Com amor, Lucas & Giovanna ❤️
        </p>
      </div>

      {/* Grid de Presentes */}
      {initialGifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-zinc-200/50 rounded-2xl text-zinc-400">
          <GiftIcon className="w-10 h-10 mb-3 text-zinc-200" />
          <p className="font-medium text-zinc-500">A vitrine está sendo preparada.</p>
          <p className="text-sm mt-1">Volte em breve para ver as novidades!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {initialGifts.map((gift) => (
            <div
              key={gift.id}
              className={`bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col group transition-all duration-300 ${
                gift.isPurchased ? 'opacity-70' : 'hover:shadow-xl hover:-translate-y-1 hover:border-zinc-300'
              }`}
            >
              {/* Imagem */}
              <div className="h-56 bg-zinc-50 relative overflow-hidden flex items-center justify-center">
                {gift.imageUrl ? (
                  <img
                    src={gift.imageUrl}
                    alt={gift.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <ImageOff className="w-8 h-8 text-zinc-200 mb-2" />
                    <span className="text-xs text-zinc-400">Imagem Ilustrativa</span>
                  </div>
                )}

                {gift.isPurchased && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <Badge className="bg-zinc-900 text-white border-0 px-4 py-1.5 rounded-full font-semibold shadow">
                      ✓ Já Comprado
                    </Badge>
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 line-clamp-1">
                    {gift.title}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-2 line-clamp-3 min-h-[60px]">
                    {gift.description || "Nos ajude com esse presente super especial para nossa nova jornada."}
                  </p>
                </div>

                <div className="pt-6 border-t border-zinc-100 flex items-center justify-between mt-6">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                      Contribuição
                    </span>
                    <span className="text-2xl font-black text-zinc-900">
                      {formatPrice(gift.amount)}
                    </span>
                  </div>

                  {gift.isPurchased ? (
                    <Button
                      disabled
                      className="rounded-full px-6 font-semibold shadow-sm bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    >
                      Presentear
                    </Button>
                  ) : (
                    <Link href={`/checkout/${gift.id}`}>
                      <Button className="rounded-full px-6 font-semibold shadow-sm bg-zinc-900 text-white hover:bg-zinc-800">
                        Presentear
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
