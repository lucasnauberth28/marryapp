import Link from "next/link";
import { LinkDeAncora } from "../anchor-link";

export type ItemDoMenu = { label: string; href: string; anchor?: boolean };

export const NAVEGACAO: ItemDoMenu[] = [
  { label: "Como funciona", href: "/#como", anchor: true },
  { label: "Convidados", href: "/#convidados", anchor: true },
  { label: "Encontrar fornecedores", href: "/fornecedores" },
  { label: "Planos", href: "/planos" },
];

export function LinkDoMenu({ item, className, onClick, children }: { item: ItemDoMenu; className?: string; onClick?: () => void; children: React.ReactNode }) {
  if (item.anchor) {
    return (
      <LinkDeAncora href={item.href as `/#${string}`} className={className} onClick={onClick}>
        {children}
      </LinkDeAncora>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
