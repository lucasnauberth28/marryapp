import { BadgeCheck, CalendarX, CircleX, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const TOM_DO_CARTAO = { sucesso: "bg-sucesso-suave", aviso: "bg-aviso-suave", perigo: "bg-perigo-suave" } as const;
const TOM_DO_TITULO = { sucesso: "text-sucesso", aviso: "text-aviso", perigo: "text-perigo" } as const;

export function CartaoDeSituacao({ icon: Icon, tone, title, children }: { icon: typeof Clock; tone: keyof typeof TOM_DO_CARTAO; title: string; children: React.ReactNode }) {
  return (
    <section role="status" className={cn("flex flex-col gap-2 rounded-2xl p-5 sm:p-6", TOM_DO_CARTAO[tone])}>
      <h2 className={cn("flex items-center gap-2 text-lg font-semibold", TOM_DO_TITULO[tone])}>
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        {title}
      </h2>
      <div className="flex flex-col gap-2 text-[15px] text-tinta">{children}</div>
    </section>
  );
}

export function PropostaAceita({ nome, quando, companyName }: { nome: string | null; quando: string; companyName: string }) {
  return (
    <CartaoDeSituacao icon={BadgeCheck} tone="sucesso" title="Proposta aceita">
      <p>
        Aceita por <strong className="font-semibold">{nome}</strong> em {quando}.
      </p>
      <p className="font-semibold">Próximos passos</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>{companyName} vai entrar em contato para o contrato.</li>
        <li>Combinem a forma de pagamento e os detalhes do dia direto com o fornecedor.</li>
      </ul>
    </CartaoDeSituacao>
  );
}

export function PropostaIndisponivel({ companyName }: { companyName: string }) {
  return (
    <CartaoDeSituacao icon={CircleX} tone="perigo" title="Proposta indisponível">
      <p>Esta proposta não está mais disponível. Se ainda tiver interesse, fale com {companyName}.</p>
    </CartaoDeSituacao>
  );
}

export function PropostaExpirada({ validUntil, companyName }: { validUntil: string | null; companyName: string }) {
  return (
    <CartaoDeSituacao icon={CalendarX} tone="aviso" title="Proposta expirada">
      <p>
        O prazo desta proposta terminou em {validUntil}. Peça a {companyName} uma proposta atualizada.
      </p>
    </CartaoDeSituacao>
  );
}
