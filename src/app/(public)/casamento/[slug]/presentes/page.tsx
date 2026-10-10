import { Metadata } from "next"
import { getIdentityForWedding, guestPageMetadata } from "@/lib/wedding"
import { getWeddingGifts } from "@/lib/wedding-data"
import { requirePublicWedding } from "@/lib/wedding-redirect"
import { isCardPaymentAvailable } from "@/lib/mercadopago"
import { PublicGiftsClient } from "./public-gifts-client"

// Lê o banco a cada acesso: nunca pré-renderizar no build (dados congelados e build dependente do banco)
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return guestPageMetadata(slug, "Lista de presentes")
}

export default async function ListaPresentesPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const wedding = await requirePublicWedding(slug)
  const [gifts, { coupleNames }] = await Promise.all([
    getWeddingGifts(wedding.id).catch((error) => {
      console.error("Erro ao buscar presentes:", error)
      return []
    }),
    getIdentityForWedding(wedding),
  ])

  return (
    <div className="flex-1 py-12 px-6 w-full max-w-6xl mx-auto animate-in fade-in duration-500">
      <PublicGiftsClient initialGifts={gifts} coupleNames={coupleNames} cardEnabled={isCardPaymentAvailable()} />
    </div>
  )
}
