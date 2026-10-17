import { LoadingRegion, SkeletonPageHeader } from "@/components/skeletons";
import { ExpensesSkeleton, PaymentsSkeleton, SectionSkeleton, StatsSkeleton } from "./skeletons";

// Espelha as finanças: cabeçalho, quatro números, despesas e pagamentos dos presentes.
export default function LoadingFinancas() {
  return (
    <LoadingRegion label="as finanças" className="flex flex-col gap-6">
      <SkeletonPageHeader />
      <StatsSkeleton />
      <SectionSkeleton>
        <ExpensesSkeleton />
      </SectionSkeleton>
      <SectionSkeleton bordered>
        <PaymentsSkeleton />
      </SectionSkeleton>
    </LoadingRegion>
  );
}
