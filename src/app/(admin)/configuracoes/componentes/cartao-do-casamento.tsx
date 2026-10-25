import type { ReactNode } from "react";
import Link from "next/link";
import { Botao } from "@/components/ui/button";
import { Cartao, CabecalhoDoCartao, ConteudoDoCartao, DescricaoDoCartao, TituloDoCartao } from "@/components/ui/card";

export interface ResumoDoCasamento {
  names: string;
  date: string | null;
  place: string | null;
  address: string | null;
}

function Informacao({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm font-semibold leading-5 text-tinta-suave">{label}</dt>
      <dd className="min-w-0 break-words text-base leading-6 text-tinta">{children}</dd>
    </div>
  );
}

/** Resumo do casamento (os dados são editados no editor do site). */
export function CartaoDoCasamento({ summary }: { summary: ResumoDoCasamento }) {
  return (
    <Cartao className="gap-4">
      <CabecalhoDoCartao>
        <TituloDoCartao>O casamento</TituloDoCartao>
        <DescricaoDoCartao>Nomes, data, local, cor do tema e fotos ficam no editor do site, com prévia ao vivo.</DescricaoDoCartao>
      </CabecalhoDoCartao>
      <ConteudoDoCartao className="flex flex-col gap-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Informacao label="Nomes no site">{summary.names}</Informacao>
          <Informacao label="Data">{summary.date ?? "Ainda sem data"}</Informacao>
          <Informacao label="Local">{summary.place ?? "A definir"}</Informacao>
          <Informacao label="Endereço do site">{summary.address ?? "Disponível depois de concluir o cadastro"}</Informacao>
        </dl>
        <div>
          <Botao asChild variant="outline">
            <Link href="/site-builder">Editar no editor do site</Link>
          </Botao>
        </div>
      </ConteudoDoCartao>
    </Cartao>
  );
}
