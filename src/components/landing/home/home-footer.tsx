import Link from "next/link";
import { Logotipo } from "@/components/brand/logo";
import { SeletorSegmentadoDoTema } from "@/components/theme/theme-toggle";
import { LinkDeAncora } from "../anchor-link";

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
          <nav aria-label="Para casais">
            <h2>Para casais</h2>
            <ul>
              <li>
                <LinkDeAncora href="/#como">Como funciona</LinkDeAncora>
              </li>
              <li>
                <Link href="/planos">Planos</Link>
              </li>
              <li>
                <Link href="/monte-seu-plano">Montar o plano de vocês</Link>
              </li>
              <li>
                <LinkDeAncora href="/#duvidas">Perguntas</LinkDeAncora>
              </li>
              <li>
                <Link href="/cadastro?plano=basic">Criar conta grátis</Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Fornecedores">
            <h2>Fornecedores</h2>
            <ul>
              <li>
                <Link href="/fornecedores">Encontrar fornecedores</Link>
              </li>
              <li>
                <Link href="/planos#fornecedores">Aceito para empresas</Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Conta e documentos">
            <h2>Conta</h2>
            <ul>
              <li>
                <Link href="/login">Entrar</Link>
              </li>
              <li>
                <Link href="/termos">Termos de uso</Link>
              </li>
              <li>
                <Link href="/privacidade">Privacidade</Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="lp-rodape-base">
          <p>© {new Date().getFullYear()} Aceito. Feito no Brasil para quem vai dizer sim.</p>
          <SeletorSegmentadoDoTema />
        </div>
      </div>
    </footer>
  );
}
