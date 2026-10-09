import { notFound } from "next/navigation";
import { getPartnerVendorById } from "@/actions/partner-vendor-actions";
import { recordVendorProfileView } from "@/lib/vendor-profile-views";
import { toIsoDate, todayBrasilia } from "@/app/(fornecedor)/_lib/vendor-panel";
import { VendorDetailClient } from "./vendor-detail-client";

interface VendorDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const { id } = await params;
  const vendor = await getPartnerVendorById(id);

  if (!vendor) {
    notFound();
  }

  // Visita ao perfil (gravada depois da resposta; ignora o próprio fornecedor, robôs e prefetch).
  await recordVendorProfileView(vendor.id);

  return <VendorDetailClient vendor={vendor} todayIso={toIsoDate(todayBrasilia())} />;
}
