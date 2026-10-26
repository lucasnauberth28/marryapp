import { useState, useTransition } from "react";
import { Mail, MailCheck } from "lucide-react";
import { reenviarConfirmacaoDeEmail } from "@/actions/conta/email";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { AvisoDoFormulario } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { Secao } from "./secao";

function ReenviarConfirmacao() {
  const [isPending, startTransition] = useTransition();
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const enviar = () => {
    setError("");
    startTransition(async () => {
      const res = await reenviarConfirmacaoDeEmail();
      if (res.success) setEnviado(true);
      else setError(res.error);
    });
  };
  if (enviado) {
    return (
      <p role="status" className="rounded-[12px] border border-linha bg-areia px-4 py-3 text-[15px] leading-6 text-tinta">
        Enviamos o link para o seu e-mail. Ele vale por 24 horas. Confira também a caixa de spam.
      </p>
    );
  }
  return (
    <div className="flex flex-col items-start gap-3">
      {error ? <AvisoDoFormulario>{error}</AvisoDoFormulario> : null}
      <BotaoComCarregamento type="button" loading={isPending} onClick={enviar} className={cn(estiloDoBotao.primary, "min-h-12")}>
        Enviar o link de confirmação
      </BotaoComCarregamento>
    </div>
  );
}

export function SecaoDoEmail({ email, verified }: { email: string; verified: boolean }) {
  return (
    <Secao
      id="email"
      icon={verified ? MailCheck : Mail}
      title="E-mail"
      description={
        verified ? (
          <>
            <strong className="font-semibold text-tinta">{email}</strong> está confirmado.
          </>
        ) : (
          <>
            Falta confirmar que <strong className="font-semibold text-tinta">{email}</strong> é seu. É por ele que chegam os avisos e a nova senha, se você esquecer.
          </>
        )
      }
    >
      {verified ? null : <ReenviarConfirmacao />}
    </Secao>
  );
}
