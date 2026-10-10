import Link from "next/link";
import { btn } from "@/components/landing/styles";
import { StatusScreen } from "@/components/feedback/status-screen";

export const metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <StatusScreen
      eyebrow="Erro 404"
      title="Esta página não está na lista"
      description="O link pode ter mudado ou o site do casal pode ter saído do ar. Confira o endereço com quem te convidou."
      actions={
        <>
          <Link href="/" className={btn.primary}>
            Ir para o início
          </Link>
          <Link href="/casamento" className={btn.secondary}>
            Ver um site de exemplo
          </Link>
        </>
      }
    />
  );
}
