import { redirect } from "next/navigation";
import { ConviteDigital } from "@/components/public/convite-digital/convite-digital";
import { SiteIndisponivel } from "@/components/public/site-unavailable";
import { metadadosDaPaginaDoConvidado } from "@/lib/casamento/wedding";
import { obterDadosDoSitePublico } from "@/lib/casamento/wedding-data";
import { casamentoPublicoTemModulo } from "@/lib/casamento/wedding-plan";
import { caminhoDoSiteDoCasamento } from "@/lib/casamento/wedding-links";
import { exigirCasamentoPublico } from "@/lib/casamento/wedding-redirect";
import { escolhasDoConvite, nomeDoConvidadoPeloCodigo } from "@/lib/convidados/convite-digital";

// O convite muda a cada convidado (código na URL): nunca pré-renderizar.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { ...(await metadadosDaPaginaDoConvidado(slug, "Convite", "Vocês estão convidados para o nosso casamento.", "convite")), robots: { index: false, follow: false } };
}

export default async function ConvitePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ c?: string }> }) {
  const [{ slug }, { c }] = await Promise.all([params, searchParams]);
  const wedding = await exigirCasamentoPublico(slug);
  if (wedding.suspendedAt) return <SiteIndisponivel />;
  // Convite digital é do Classic e do VIP: nos outros planos, o endereço leva ao site
  if (!(await casamentoPublicoTemModulo(wedding.id, "convite"))) redirect(caminhoDoSiteDoCasamento(wedding.slug));

  const [{ settings }, escolhas] = await Promise.all([obterDadosDoSitePublico(wedding), escolhasDoConvite(wedding.id)]);
  const nome = escolhas.guestName ? await nomeDoConvidadoPeloCodigo(wedding.id, c) : null;
  return <ConviteDigital slug={wedding.slug} settings={settings} nomeDoConvidado={nome} frase={escolhas.message} />;
}
