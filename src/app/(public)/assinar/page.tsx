import { Suspense } from "react";
import { AssinarClient } from "./assinar-client";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Escolha seu Plano | MarryApp Checkout",
  description: "Ative seu plano no MarryApp para noivos ou fornecedores.",
};

export default function AssinarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FCFBF9]">
          <Loader2 className="w-8 h-8 animate-spin text-[#8C6D45]" />
        </div>
      }
    >
      <AssinarClient />
    </Suspense>
  );
}
