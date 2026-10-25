import type { ReactNode } from "react";
import type { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Propriedades {
  id: string;
  icon: typeof Lock;
  title: string;
  description: ReactNode;
  tone?: "default" | "danger";
  children: ReactNode;
}

export function Secao({ id, icon: Icon, title, description, tone = "default", children }: Propriedades) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={cn("scroll-mt-24 flex flex-col gap-5 rounded-[20px] border bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-7", tone === "danger" ? "border-perigo/25" : "border-linha")}>
      <div className="flex items-start gap-4">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-[12px]", tone === "danger" ? "bg-perigo-suave text-perigo" : "bg-ameixa-suave text-ameixa")}>
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.6} />
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-titulo`} className="font-display text-2xl leading-8 text-tinta">
            {title}
          </h2>
          <p className="mt-0.5 text-[15px] leading-[22px] text-tinta-suave">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
