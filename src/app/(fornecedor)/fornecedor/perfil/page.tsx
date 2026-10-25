import type { Metadata } from "next";
import { Aparicao } from "@/components/motion/reveal";
import prisma from "@/lib/prisma";
import { obterContextoDaPaginaDoFornecedor } from "@/lib/security/vendor-guard";
import { EtiquetaDaCuradoria } from "../../_components/status-chip";
import { centavosParaCampoDeReais, MAXIMO_DE_IMAGENS_NA_GALERIA, interpretarGaleria, interpretarRegioes, CATEGORIAS_DE_FORNECEDOR } from "../../_lib/perfil-do-fornecedor";
import { FormularioDeMidias } from "./formulario-de-midias";
import { FormularioDePerfil } from "./formulario-de-perfil";

export const metadata: Metadata = { title: "Meu perfil" };

const DICA_DA_CURADORIA: Record<string, string> = {
  APPROVED: "Seu perfil está publicado na lista de fornecedores do Aceito.",
  PENDING_APPROVAL: "O Aceito está analisando seu perfil. Ele aparece na lista de fornecedores assim que for aprovado.",
  REJECTED: "Ajuste os pontos indicados e salve: o perfil volta para a fila da curadoria.",
};

function AvisoDaCuradoria({ status, notas, completude }: { status: string; notas: string | null; completude: number }) {
  return (
    <Aparicao variant="fade" className="flex flex-col gap-3 rounded-2xl border border-linha bg-areia/60 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5">
      <EtiquetaDaCuradoria status={status} />
      <span className="text-tinta-suave">
        {DICA_DA_CURADORIA[status] ?? DICA_DA_CURADORIA.PENDING_APPROVAL} · Perfil {completude}% completo
      </span>
      {status === "REJECTED" && notas ? (
        <p className="w-full rounded-xl bg-perigo-suave px-4 py-3 text-sm text-perigo">
          <strong className="font-semibold">Recado da curadoria:</strong> {notas}
        </p>
      ) : null}
    </Aparicao>
  );
}

export default async function PerfilPage() {
  const { vendor } = await obterContextoDaPaginaDoFornecedor();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  // Galeria não vem no contexto da sessão: lê só do fornecedor da sessão.
  const media = await prisma.partnerVendor.findUnique({ where: { id: vendor.id }, select: { galleryImages: true } });
  const gallery = interpretarGaleria(media?.galleryImages ?? null).slice(0, MAXIMO_DE_IMAGENS_NA_GALERIA);

  const fields = [
    gallery.length > 0 ? "galeria" : null,
    vendor.description,
    vendor.startingPrice,
    vendor.serviceRegions,
    vendor.whatsapp,
    vendor.instagram,
    vendor.logoUrl,
    vendor.coverUrl,
  ];
  const completeness = Math.round(((fields.filter(Boolean).length + 2) / (fields.length + 2)) * 100);
  const categories: string[] = [...CATEGORIAS_DE_FORNECEDOR];
  if (!categories.includes(vendor.category)) categories.unshift(vendor.category);

  return (
    <div className="flex max-w-[980px] flex-col gap-6">
      <FormularioDePerfil
        vendorId={vendor.id}
        isPublic={vendor.curationStatus === "APPROVED"}
        categories={categories}
        notice={<AvisoDaCuradoria status={vendor.curationStatus} notas={vendor.curationNotes} completude={completeness} />}
        portfolio={<FormularioDeMidias initial={{ logoUrl: vendor.logoUrl, coverUrl: vendor.coverUrl, gallery }} />}
        initial={{
          companyName: vendor.companyName,
          category: vendor.category,
          description: vendor.description ?? "",
          startingPrice: centavosParaCampoDeReais(vendor.startingPrice),
          serviceRegions: interpretarRegioes(vendor.serviceRegions).join(", "),
          whatsapp: vendor.whatsapp ?? "",
          instagram: vendor.instagram ?? "",
          website: vendor.website ?? "",
        }}
      />
    </div>
  );
}
