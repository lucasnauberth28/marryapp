// Os campos do pedido do endereço, a conferência do nome e o envio do pedido.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { pedirDominio } from "@/actions/domain-actions";
import { SUFIXO_DO_DOMINIO } from "@/lib/dominio/domain-name";
import type { DadosDoPedido, ErrosDoPedido } from "./tipos";
import { useConferenciaDoDominio } from "./use-conferencia-do-dominio";

export function usePedidoDeDominio(padrao: { name: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dados, setDados] = useState<DadosDoPedido>({ name: "", holderName: padrao.name, holderDocument: "", holderEmail: padrao.email, holderPhone: "", accepted: false });
  const [errors, setErrors] = useState<ErrosDoPedido>({});
  const [formError, setFormError] = useState<string | null>(null);
  const { check, agendar } = useConferenciaDoDominio();

  const mudar = <C extends keyof DadosDoPedido>(campo: C, valor: DadosDoPedido[C]) => setDados((d) => ({ ...d, [campo]: valor }));
  const limparErro = (campo: keyof ErrosDoPedido) => setErrors((e) => ({ ...e, [campo]: undefined }));

  const mudarNome = (valor: string) => {
    mudar("name", valor);
    limparErro("domain");
    agendar(valor);
  };

  const escolher = (domain: string) => {
    const nome = domain.slice(0, -SUFIXO_DO_DOMINIO.length);
    mudar("name", nome);
    limparErro("domain");
    agendar(nome, true);
  };

  const enviar = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const { name, ...titular } = dados;
      const result = await pedirDominio({ domain: name, ...titular });
      if (result.success) {
        toast.success("Pedido enviado. Avisaremos quando o endereço for registrado.");
        return router.refresh();
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error ?? (result.fieldErrors ? "Confiram os campos marcados." : null));
    });
  };

  return { dados, mudar, errors, limparErro, formError, check, pending, mudarNome, escolher, enviar };
}

export type PedidoDeDominio = ReturnType<typeof usePedidoDeDominio>;
