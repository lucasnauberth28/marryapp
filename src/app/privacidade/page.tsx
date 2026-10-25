import type { Metadata } from "next";
import { PaginaLegal } from "@/components/legal/legal-page";
import { secoesDeColeta } from "./secoes/coleta";
import { secoesDeDireitos } from "./secoes/direitos";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o Aceito trata os dados de casais, convidados e fornecedores, de acordo com a LGPD.",
};

const secoes = [...secoesDeColeta, ...secoesDeDireitos];

export default function PrivacidadePage() {
  return (
    <PaginaLegal
      title="Política de privacidade"
      updatedAt="24 de outubro de 2026"
      intro={
        <p>
          Esta política explica, em linguagem direta, quais dados pessoais o Aceito trata, por que, com quem compartilha e como você exerce
          seus direitos pela Lei Geral de Proteção de Dados (Lei 13.709/2018, &quot;LGPD&quot;).
        </p>
      }
      sections={secoes}
      related={{ href: "/termos", label: "Termos de uso" }}
    />
  );
}
