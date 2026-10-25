"use client"; // Error boundaries precisam ser Client Components

import { useEffect } from "react";
import Link from "next/link";
import { estiloDoBotao } from "@/components/landing/styles";
import { TelaDeSituacao } from "@/components/feedback/status-screen";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <TelaDeSituacao
      glyph="!"
      eyebrow="Algo deu errado"
      title="Não conseguimos carregar esta página"
      description={`Pode ser uma instabilidade momentânea. Tente de novo em alguns segundos.${error.digest ? ` Código: ${error.digest}` : ""}`}
      actions={
        <>
          <button type="button" className={estiloDoBotao.primary} onClick={() => unstable_retry()}>
            Tentar de novo
          </button>
          <Link href="/" className={estiloDoBotao.secondary}>
            Ir para o início
          </Link>
        </>
      }
    />
  );
}
