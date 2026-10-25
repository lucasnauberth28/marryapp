import { SiteUnavailable } from "@/components/public/site-unavailable"
import { Metadata } from "next"
import { GuestHeader } from "@/components/public/guest-header"
import { obterIdentidadeDoCasamento, metadadosDaPaginaDoConvidado } from "@/lib/wedding"
import { obterPresentesDoCasamento } from "@/lib/wedding-data"
import { exigirCasamentoPublico } from "@/lib/wedding-redirect"
import { pagamentoPorCartaoEstaDisponivel } from "@/lib/mercadopago"
import { PublicGiftsClient } from "./public-gifts-client"

// Lê o banco a cada acesso: nunca pré-renderizar no build (dados congelados e build dependente do banco)
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return metadadosDaPaginaDoConvidado(slug, "Presentes em dinheiro", undefined, "presentes")
}

export default async function ListaPresentesPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const wedding = await exigirCasamentoPublico(slug)
  if (wedding.suspendedAt) return <SiteUnavailable />
  const [gifts, identity] = await Promise.all([
    obterPresentesDoCasamento(wedding.id).catch((error) => {
      console.error("Erro ao buscar presentes:", error)
      return []
    }),
    obterIdentidadeDoCasamento(wedding),
  ])

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-linho text-tinta">
      <GuestHeader slug={wedding.slug} initials={identity.initials} coupleNames={identity.coupleNames} current="presentes" title="Presentes em dinheiro" />
      <PublicGiftsClient initialGifts={gifts} coupleNames={identity.coupleNames} cardEnabled={pagamentoPorCartaoEstaDisponivel()} />
    </div>
  )
}
