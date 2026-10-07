import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/feedback/status-screen";

export const metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <StatusScreen
      eyebrow="Erro 404"
      title="Não encontramos esta página"
      description="O link pode estar incompleto ou o conteúdo foi removido. Confira o endereço ou volte para o início."
      actions={
        <>
          <Button asChild className="rounded-full">
            <Link href="/">Ir para o início</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/casamento">Ver o site do casal</Link>
          </Button>
        </>
      }
    />
  );
}
