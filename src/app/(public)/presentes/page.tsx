import { Metadata } from "next"
import { getGifts } from "@/actions/gift-actions"
import { PublicGiftsClient } from "./public-gifts-client"

export const metadata: Metadata = {
  title: "Lista de Presentes | MarryApp",
  description: "Escolha um presente para os noivos",
}

export default async function ListaPresentesPublicPage() {
  const result = await getGifts()
  const gifts = result.success ? result.data : []

  return (
    <div className="flex-1 py-12 px-6 w-full max-w-6xl mx-auto animate-in fade-in duration-500">
      <PublicGiftsClient initialGifts={gifts || []} />
    </div>
  )
}
