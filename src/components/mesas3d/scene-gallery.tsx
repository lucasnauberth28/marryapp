"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { CustomModal } from "@/components/ui/custom-modal";
import { CENARIOS, type IdDoCenario } from "@/lib/mesas3d/scenarios";
import { cn } from "@/lib/utils";

/** Escolha do cenário: três salões com prévia. Sem escolha feita, não dá para fechar (a cena precisa de um cenário). */
export function SceneGallery({
  open,
  current,
  onPick,
  onClose,
}: {
  open: boolean;
  current: IdDoCenario | null;
  onPick: (id: IdDoCenario) => void;
  onClose: () => void;
}) {
  return (
    <CustomModal
      isOpen={open}
      onClose={() => {
        if (current) onClose();
      }}
      title="Qual é o clima do casamento de vocês?"
      description="Escolham um cenário. As mesas e os convidados continuam os mesmos, e dá para trocar quando quiserem."
      size="xl"
    >
      <ul className="grid gap-4 sm:grid-cols-3">
        {CENARIOS.map((s) => {
          const active = s.id === current;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onPick(s.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[20px] border bg-papel text-left transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5",
                  active ? "border-ameixa shadow-[0_0_0_2px_var(--color-ameixa)]" : "border-linha hover:border-ameixa",
                )}
              >
                <Image src={`/mesas3d/${s.id}.webp`} alt={`Prévia do cenário ${s.nome}`} width={640} height={400} sizes="(min-width: 640px) 320px, 100vw" loading="eager" className="aspect-[16/10] w-full object-cover" />
                <span className="flex flex-1 flex-col gap-1 p-4">
                  <span className="font-display text-lg leading-6 text-tinta">{s.nome}</span>
                  <span className="text-sm leading-5 text-tinta-suave">{s.frase}</span>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ameixa">
                    {active ? (
                      <>
                        <Check aria-hidden="true" className="size-4" strokeWidth={2} /> Cenário atual
                      </>
                    ) : (
                      "Usar este cenário"
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </CustomModal>
  );
}
