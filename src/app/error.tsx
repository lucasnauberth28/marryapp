"use client"; // Error boundaries precisam ser Client Components

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
      eyebrow="Algo deu errado"
      title="Não conseguimos carregar esta página"
      description={`Pode ser uma instabilidade momentânea. Tente de novo em alguns segundos.${error.digest ? ` Código: ${error.digest}` : ""}`}
      actions={
        <>
          <Button className="rounded-full" onClick={() => unstable_retry()}>
            Tentar de novo
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Ir para o início</Link>
          </Button>
        </>
      }
    />
  );
}
