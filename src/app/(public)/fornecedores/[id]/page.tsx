import { notFound } from "next/navigation";
import { obterFornecedorParceiroPorId } from "@/actions/partner-vendor-actions";
import { registrarVisitaAoPerfilDoFornecedor } from "@/lib/vendor-profile-views";
import { toIsoDate, todayBrasilia } from "@/app/(fornecedor)/_lib/vendor-panel";
import { VendorDetailClient } from "./vendor-detail-client";

interface VendorDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const { id } = await params;
  const vendor = await obterFornecedorParceiroPorId(id);

  if (!vendor) {
    notFound();
  }

  // Visita ao perfil (gravada depois da resposta; ignora o próprio fornecedor, robôs e prefetch).
  await registrarVisitaAoPerfilDoFornecedor(vendor.id);

  return <VendorDetailClient vendor={vendor} todayIso={toIsoDate(todayBrasilia())} />;
}
