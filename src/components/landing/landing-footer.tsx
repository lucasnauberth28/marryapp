import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AnchorLink } from "./anchor-link";

const linkClass =
  "inline-flex min-h-11 items-center text-[15px] text-tinta underline decoration-transparent decoration-1 underline-offset-[6px] transition-[color,text-decoration-color] duration-300 hover:text-ameixa hover:decoration-current";

const LINKS: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: "Para casais",
    items: [
      { label: "Como funciona", href: "/#como" },
      { label: "Planos", href: "/planos" },
      { label: "Monte seu plano", href: "/monte-seu-plano" },
      { label: "Criar meu casamento", href: "/cadastro" },
    ],
  },
  {
    title: "Fornecedores",
    items: [
      { label: "Encontrar fornecedores", href: "/fornecedores" },
      { label: "Sou fornecedor", href: "/cadastro?plano=start" },
    ],
  },
  {
    title: "Conta",
    items: [
      { label: "Entrar", href: "/login" },
      { label: "Dúvidas frequentes", href: "/#duvidas" },
    ],
  },
];

/** Rodapé público do Aceito. Sem estado: pode ser usado em componentes de servidor ou de cliente. */
export function LandingFooter() {
  return (
    <footer className="border-t border-linha bg-papel text-tinta">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 pb-10 pt-14 sm:px-6 md:grid-cols-[1.2fr_2fr] md:gap-16 lg:pt-20">
        <div className="flex flex-col gap-4">
          <Link href="/" aria-label="Aceito, início" className="-m-2 self-start rounded-[12px] p-2">
            <Logo height={26} />
          </Link>
          <p className="max-w-[32ch] text-[15px] leading-6 text-tinta-suave">
            Do convite ao grande dia, tudo num só sim.
          </p>
        </div>

        <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          {LINKS.map((group) => (
            <div key={group.title} className="flex flex-col gap-1">
              <p className="mb-1 text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">{group.title}</p>
              <ul className="flex flex-col">
                {group.items.map((item) => (
                  <li key={item.href}>
                    {item.href.startsWith("/#") ? (
                      <AnchorLink href={item.href as `/#${string}`} className={linkClass}>
                        {item.label}
                      </AnchorLink>
                    ) : (
                      <Link href={item.href} className={linkClass}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-linha">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-4 py-6 text-sm text-tinta-suave sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Aceito. Feito no Brasil para quem vai dizer sim.</p>
          <nav aria-label="Documentos legais" className="flex flex-wrap items-center gap-x-5">
            <Link href="/termos" className={linkClass}>
              Termos de uso
            </Link>
            <Link href="/privacidade" className={linkClass}>
              Privacidade
            </Link>
          </nav>
          <p>Convidado? Você não precisa de conta: use o link do convite.</p>
        </div>
      </div>
    </footer>
  );
}
