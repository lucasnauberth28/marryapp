import Link from "next/link";

/**
 * Abas "Usuários" e "Perfis de acesso" (a tela do design tem as duas juntas;
 * no app cada uma tem seu endereço, então as abas são links entre elas).
 */
export function AccessTabs({ current }: { current: "usuarios" | "perfis" }) {
  const items = [
    { id: "usuarios", href: "/usuarios", label: "Usuários" },
    { id: "perfis", href: "/perfis", label: "Perfis de acesso" },
  ] as const;
  return (
    <nav aria-label="Acesso" className="inline-flex w-fit gap-1 rounded-xl bg-areia p-1">
      {items.map((item) => {
        const active = item.id === current;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-[10px] px-4 text-[15px] font-semibold no-underline transition-colors sm:min-h-10 ${
              active ? "bg-papel text-tinta shadow-[var(--shadow-aceito-1)]" : "text-tinta-suave hover:text-tinta"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
