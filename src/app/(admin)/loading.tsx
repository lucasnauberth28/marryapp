import { CarregamentoDoPainel } from "@/components/feedback/panel-loading";

// Rede de segurança do painel do casal: rotas sem esqueleto próprio (inclusive os endereços antigos que só redirecionam)
// mostram o esqueleto genérico enquanto a página resolve.
export default function AdminLoading() {
  return <CarregamentoDoPainel />;
}
