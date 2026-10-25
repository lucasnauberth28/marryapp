import type { Metadata } from "next";
import { PaginaLegal } from "@/components/legal/legal-page";
import { secoesDoContrato } from "./secoes/contrato";
import { secoesDeResponsabilidades } from "./secoes/responsabilidades";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Regras de uso do Aceito para casais, convidados e fornecedores.",
};

const secoes = [...secoesDoContrato, ...secoesDeResponsabilidades];

export default function TermosPage() {
  return (
    <PaginaLegal
      title="Termos de uso"
      updatedAt="24 de outubro de 2026"
      intro={<p>As regras para usar o Aceito, escritas para serem lidas: o que oferecemos, o que esperamos de cada um e como resolvemos problemas.</p>}
      sections={secoes}
      related={{ href: "/privacidade", label: "Política de privacidade" }}
    />
  );
}
