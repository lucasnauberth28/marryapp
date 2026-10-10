"use client"; // Error boundaries precisam ser Client Components

import { useEffect } from "react";
import Link from "next/link";
import { btn } from "@/components/landing/styles";
import { StatusScreen } from "@/components/feedback/status-screen";

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
    <StatusScreen
      glyph="!"
      eyebrow="Algo deu errado"
      title="Não conseguimos carregar esta página"
      description={`Pode ser uma instabilidade momentânea. Tente de novo em alguns segundos.${error.digest ? ` Código: ${error.digest}` : ""}`}
      actions={
        <>
          <button type="button" className={btn.primary} onClick={() => unstable_retry()}>
            Tentar de novo
          </button>
          <Link href="/" className={btn.secondary}>
            Ir para o início
          </Link>
        </>
      }
    />
  );
}
