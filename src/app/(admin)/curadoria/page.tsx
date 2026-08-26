import { getAllVendorsForCurationAction } from "@/actions/partner-vendor-actions";
import { CuradoriaClient } from "./curadoria-client";

export default async function CuradoriaPage() {
  const data = await getAllVendorsForCurationAction("ALL");
  return <CuradoriaClient initialVendors={data.vendors} initialCounts={data.counts} />;
}
