import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { estiloDoBotaoSecundario } from "../ui";

export interface Atalho {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function Atalhos({ items }: { items: Atalho[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-labelledby="t-atalhos" className="flex flex-wrap items-center gap-2 min-[1200px]:col-span-12">
      <h2 id="t-atalhos" className="mr-2 text-[13px] font-medium text-tinta-suave">
        Atalhos
      </h2>
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={label} href={href} className={estiloDoBotaoSecundario}>
          <Icon className="size-[17px]" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
