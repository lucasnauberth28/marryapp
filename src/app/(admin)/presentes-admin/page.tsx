import { Metadata } from "next"
import { getGifts } from "@/actions/gift-actions"
import { GiftsClient } from "./gifts-client"

export const metadata: Metadata = {
  title: "Vitrine de Presentes | MarryApp",
  description: "Gerencie os presentes de casamento",
}

export default async function PresentesAdminPage() {
  const result = await getGifts()
  const gifts = result.success ? result.data : []

  return (
    <div className="flex-1 p-8 pt-6 w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GiftsClient initialGifts={gifts || []} />
    </div>
  )
}
