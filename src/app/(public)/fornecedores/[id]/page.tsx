import { notFound } from "next/navigation";
import { obterFornecedorParceiroPorId } from "@/actions/partner-vendor-actions";
import { registrarVisitaAoPerfilDoFornecedor } from "@/lib/vendor-profile-views";
import { paraDataIso, hojeEmBrasilia } from "@/app/(fornecedor)/_lib/vendor-panel";
import { DetalheDoFornecedorCliente } from "./vendor-detail-client";

interface PropriedadesDaPaginaDoFornecedor {
  params: Promise<{
    id: string;
  }>;
}

export default async function VendorDetailPage({ params }: PropriedadesDaPaginaDoFornecedor) {
  const { id } = await params;
  const vendor = await obterFornecedorParceiroPorId(id);

  if (!vendor) {
    notFound();
  }

  // Visita ao perfil (gravada depois da resposta; ignora o próprio fornecedor, robôs e prefetch).
  await registrarVisitaAoPerfilDoFornecedor(vendor.id);

  return <DetalheDoFornecedorCliente vendor={vendor} todayIso={paraDataIso(hojeEmBrasilia())} />;
}
