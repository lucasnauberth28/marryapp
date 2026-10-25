import { descreverLimite } from "@/lib/platform/config-core";
import { LimitesDeSeguranca } from "@/lib/security/rate-limiter";
import { SecaoDaConfiguracao } from "./secao";

const LIMITES: { key: keyof typeof LimitesDeSeguranca; label: string }[] = [
  { key: "SIGNUP", label: "Cadastros por rede" },
  { key: "LOGIN", label: "Tentativas de entrar por rede" },
  { key: "LOGIN_ACCOUNT", label: "Tentativas de entrar por conta" },
  { key: "CHECKOUT", label: "Tentativas de pagamento" },
  { key: "RSVP", label: "Respostas de presença" },
  { key: "MESSAGES", label: "Mensagens de WhatsApp disparadas pelo painel" },
  { key: "PUBLIC_FORM", label: "Recados, avaliações e pedidos de orçamento" },
  { key: "PAYMENT_STATUS", label: "Consulta do status de pagamento" },
];

export function SecaoDosLimites() {
  return (
    <SecaoDaConfiguracao id="limites" title="Limites de uso" description="Só leitura: protegem o Aceito de abuso e vêm do código. Pessoas de verdade quase nunca chegam perto.">
      <dl className="divide-y divide-linha text-[15px]">
        {LIMITES.map((l) => (
          <div key={l.key} className="flex flex-wrap justify-between gap-2 py-2.5">
            <dt className="text-tinta-suave">{l.label}</dt>
            <dd className="font-semibold text-tinta">{descreverLimite(LimitesDeSeguranca[l.key].limit, LimitesDeSeguranca[l.key].windowMs)}</dd>
          </div>
        ))}
      </dl>
    </SecaoDaConfiguracao>
  );
}
