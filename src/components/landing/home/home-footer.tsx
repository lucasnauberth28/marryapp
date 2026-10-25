import Link from "next/link";
import { Logotipo } from "@/components/brand/logo";
import { SeletorSegmentadoDoTema } from "@/components/theme/theme-toggle";
import { LinkDeAncora } from "../anchor-link";

type LinkDoRodape = { label: string; href: string; ancora?: boolean };

const COLUNAS: { titulo: string; rotulo: string; links: LinkDoRodape[] }[] = [
  {
    titulo: "Para casais",
    rotulo: "Para casais",
    links: [
      { label: "Como funciona", href: "/#como", ancora: true },
      { label: "Planos", href: "/planos" },
      { label: "Montar o plano de vocês", href: "/monte-seu-plano" },
      { label: "Perguntas", href: "/#duvidas", ancora: true },
      { label: "Criar conta grátis", href: "/cadastro?plano=basic" },
    ],
  },
  {
    titulo: "Fornecedores",
    rotulo: "Fornecedores",
    links: [
      { label: "Encontrar fornecedores", href: "/fornecedores" },
      { label: "Aceito para empresas", href: "/planos#fornecedores" },
    ],
  },
  {
    titulo: "Conta",
    rotulo: "Conta e documentos",
    links: [
      { label: "Entrar", href: "/login" },
      { label: "Termos de uso", href: "/termos" },
      { label: "Privacidade", href: "/privacidade" },
    ],
  },
];

function ColunaDoRodape({ titulo, rotulo, links }: (typeof COLUNAS)[number]) {
  return (
    <nav aria-label={rotulo}>
      <h2>{titulo}</h2>
      <ul>
        {links.map((l) => (
          <li key={l.href}>{l.ancora ? <LinkDeAncora href={l.href as `/#${string}`}>{l.label}</LinkDeAncora> : <Link href={l.href}>{l.label}</Link>}</li>
        ))}
      </ul>
    </nav>
  );
}

/** Rodapé da home. Mesmos links do rodapé público de antes, no desenho da landing. */
export function RodapeDaHome() {
  return (
    <footer className="lp-rodape">
      <div className="lp-moldura">
        <div className="lp-rodape-grade">
          <div className="lp-rodape-marca">
            <Link href="/" className="lp-marca" aria-label="Aceito, início">
              <Logotipo height={30} />
            </Link>
            <p className="lp-mudo">Foi convidado? Use o link enviado pelo casal. Você não precisa criar conta.</p>
          </div>
          {COLUNAS.map((c) => (
            <ColunaDoRodape key={c.titulo} {...c} />
          ))}
        </div>
        <div className="lp-rodape-base">
          <p>© {new Date().getFullYear()} Aceito. Feito no Brasil para quem vai dizer sim.</p>
          <SeletorSegmentadoDoTema />
        </div>
      </div>
    </footer>
  );
}
