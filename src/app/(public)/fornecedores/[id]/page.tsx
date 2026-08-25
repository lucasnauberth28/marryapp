import { notFound } from "next/navigation";
import { getPartnerVendorById } from "@/actions/partner-vendor-actions";
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

  return <VendorDetailClient vendor={vendor} />;
}
