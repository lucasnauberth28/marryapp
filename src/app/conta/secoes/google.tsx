import { useState, useTransition } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { desconectarGoogle } from "@/actions/conta/google";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { AvisoDoFormulario } from "@/components/ui/field";
import { formatarDataBrasiliaLonga } from "@/lib/formatacao/data";
import { cn } from "@/lib/utils";
import { Secao } from "./secao";
import type { Propriedades } from "./tipos";

interface PropriedadesDoGoogle {
  google: Propriedades["google"];
  hasPassword: boolean;
  /** E-mail da conta: é com ele que o Google se liga sozinho no primeiro "Continuar com o Google". */
  email: string;
}

function Desconectar() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const desconectar = () => {
    setError("");
    startTransition(async () => {
      const res = await desconectarGoogle();
      if (!res.success) return setError(res.error);
      toast.success("Google desconectado.");
      window.location.reload();
    });
  };
  return (
    <div className="flex flex-col items-start gap-3">
      {error ? <AvisoDoFormulario>{error}</AvisoDoFormulario> : null}
      <BotaoComCarregamento type="button" loading={isPending} onClick={desconectar} className={cn(estiloDoBotao.secondary, "min-h-12")}>
        Desconectar o Google
      </BotaoComCarregamento>
    </div>
  );
}

export function SecaoDoGoogle({ google, hasPassword, email }: PropriedadesDoGoogle) {
  if (!google) {
    return (
      <Secao id="google" icon={Link2} title="Google" description={<>Para entrar com o Google, use “Continuar com o Google” na tela de entrada com a conta Google do e-mail <strong className="font-semibold text-tinta">{email}</strong>. A ligação acontece sozinha.</>}>
        <p className="text-[15px] leading-6 text-tinta-suave">Seu acesso por e-mail e senha continua como está.</p>
      </Secao>
    );
  }
  return (
    <Secao id="google" icon={Link2} title="Google" description={<>Conectado em {formatarDataBrasiliaLonga(new Date(google.since))}. Você pode entrar com <strong className="font-semibold text-tinta">{google.email}</strong> sem digitar senha.</>}>
      {hasPassword ? <Desconectar /> : <p className="text-[15px] leading-6 text-tinta-suave">O Google é o seu jeito de entrar. Crie uma senha na seção acima se quiser poder desconectá-lo.</p>}
    </Secao>
  );
}
