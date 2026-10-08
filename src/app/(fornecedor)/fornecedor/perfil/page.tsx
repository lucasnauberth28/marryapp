import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { getVendorPageContext } from "@/lib/security/vendor-guard";
import { CurationChip } from "../../_components/status-chip";
import { centsToBrlInput, parseRegions, VENDOR_CATEGORIES } from "../../_lib/vendor-panel";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Meu perfil" };

const CURATION_HINT: Record<string, string> = {
  APPROVED: "Seu perfil está publicado na vitrine de fornecedores do Aceito.",
  PENDING_APPROVAL: "A curadoria está revisando seu perfil. Ele aparece na vitrine assim que for aprovado.",
  REJECTED: "Ajuste os pontos indicados e salve: o perfil volta para a fila da curadoria.",
};

export default async function PerfilPage() {
  const { vendor } = await getVendorPageContext();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  const fields = [
    vendor.description,
    vendor.startingPrice,
    vendor.serviceRegions,
    vendor.whatsapp,
    vendor.instagram,
    vendor.logoUrl,
    vendor.coverUrl,
  ];
  const completeness = Math.round(((fields.filter(Boolean).length + 2) / (fields.length + 2)) * 100);
  const categories: string[] = [...VENDOR_CATEGORIES];
  if (!categories.includes(vendor.category)) categories.unshift(vendor.category);

  return (
    <div className="flex max-w-[980px] flex-col gap-6">
      <ProfileForm
        vendorId={vendor.id}
        isPublic={vendor.curationStatus === "APPROVED"}
        categories={categories}
        notice={
          <Reveal
            variant="fade"
            className="flex flex-col gap-3 rounded-2xl border border-linha bg-areia/60 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5"
          >
            <CurationChip status={vendor.curationStatus} />
            <span className="text-tinta-suave">
              {CURATION_HINT[vendor.curationStatus] ?? CURATION_HINT.PENDING_APPROVAL} · Perfil {completeness}% completo
            </span>
            {vendor.curationStatus === "REJECTED" && vendor.curationNotes ? (
              <p className="w-full rounded-xl bg-perigo-suave px-4 py-3 text-sm text-perigo">
                <strong className="font-semibold">Recado da curadoria:</strong> {vendor.curationNotes}
              </p>
            ) : null}
          </Reveal>
        }
        initial={{
          companyName: vendor.companyName,
          category: vendor.category,
          description: vendor.description ?? "",
          startingPrice: centsToBrlInput(vendor.startingPrice),
          serviceRegions: parseRegions(vendor.serviceRegions).join(", "),
          whatsapp: vendor.whatsapp ?? "",
          instagram: vendor.instagram ?? "",
          website: vendor.website ?? "",
        }}
      />
    </div>
  );
}
