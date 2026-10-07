import { Metadata } from "next"
import { getGifts } from "@/actions/gift-actions"
import { guestPageMetadata, getWeddingIdentity } from "@/lib/wedding"
import { PublicGiftsClient } from "./public-gifts-client"

// Lê o banco a cada acesso: nunca pré-renderizar no build (dados congelados e build dependente do banco)
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return guestPageMetadata("Lista de presentes")
}

export default async function ListaPresentesPublicPage() {
  const result = await getGifts()
  const gifts = result.success ? result.data : []
  const { coupleNames } = await getWeddingIdentity()

  return (
    <div className="flex-1 py-12 px-6 w-full max-w-6xl mx-auto animate-in fade-in duration-500">
      <PublicGiftsClient initialGifts={gifts || []} coupleNames={coupleNames} />
    </div>
  )
}
