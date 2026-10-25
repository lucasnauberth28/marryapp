import { SiteIndisponivel } from "@/components/public/site-unavailable"
import { Metadata } from "next"
import { CabecalhoDoConvidado } from "@/components/public/guest-header"
import { obterIdentidadeDoCasamento, metadadosDaPaginaDoConvidado } from "@/lib/casamento/wedding"
import { obterPresentesDoCasamento } from "@/lib/casamento/wedding-data"
import { exigirCasamentoPublico } from "@/lib/casamento/wedding-redirect"
import { pagamentoPorCartaoEstaDisponivel } from "@/lib/pagamento/mercadopago"
import { PresentesPublicosCliente } from "./public-gifts-client"

// Lê o banco a cada acesso: nunca pré-renderizar no build (dados congelados e build dependente do banco)
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return metadadosDaPaginaDoConvidado(slug, "Presentes em dinheiro", undefined, "presentes")
}

export default async function ListaPresentesPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const wedding = await exigirCasamentoPublico(slug)
  if (wedding.suspendedAt) return <SiteIndisponivel />
  const [gifts, identity] = await Promise.all([
    obterPresentesDoCasamento(wedding.id).catch((error) => {
      console.error("Erro ao buscar presentes:", error)
      return []
    }),
    obterIdentidadeDoCasamento(wedding),
  ])

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-linho text-tinta">
      <CabecalhoDoConvidado slug={wedding.slug} initials={identity.initials} coupleNames={identity.coupleNames} current="presentes" title="Presentes em dinheiro" />
      <PresentesPublicosCliente initialGifts={gifts} coupleNames={identity.coupleNames} cardEnabled={pagamentoPorCartaoEstaDisponivel()} />
    </div>
  )
}
