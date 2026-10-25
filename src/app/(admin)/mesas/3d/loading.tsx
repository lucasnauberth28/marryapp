import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento } from "@/components/skeletons";

// Espelha as mesas em 3D: título, a lista de convidados ao lado e a área do cenário.
export default function Mesas3DLoading() {
  return (
    <RegiaoDeCarregamento label="as mesas em 3D" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Esqueleto className="h-3.5 w-16 rounded-md" />
        <Esqueleto className="h-9 w-56 rounded-lg" />
      </div>
      <div className="grid gap-4 lg:h-[calc(100dvh-13rem)] lg:min-h-[560px] lg:grid-cols-[320px_minmax(0,1fr)]">
        <Esqueleto className="order-2 h-80 rounded-2xl lg:order-1 lg:h-auto" />
        <Esqueleto className="order-1 h-[64vh] min-h-[380px] rounded-2xl lg:order-2 lg:h-auto" />
      </div>
    </RegiaoDeCarregamento>
  );
}
