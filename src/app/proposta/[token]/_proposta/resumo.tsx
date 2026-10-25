import { CARTAO_DA_PAGINA_COM_TOKEN, SOBRETITULO_DA_PAGINA_COM_TOKEN } from "@/components/public/token-page-shell";
import { formatarDataEHoraEmBrasilia } from "@/app/(fornecedor)/_lib/datas-do-painel";
import { formatarReaisDoPainel } from "@/app/(fornecedor)/_lib/perfil-do-fornecedor";
import { cn } from "@/lib/utils";

interface Propriedades {
  amount: number;
  dateLong: string | null;
  validUntil: string | null;
  expired: boolean;
  location: string | null;
  details: string | null;
  sentAt: Date;
}

function Dado({ rotulo, children, larga = false }: { rotulo: string; children: React.ReactNode; larga?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-0.5", larga && "sm:col-span-2")}>
      <dt className={SOBRETITULO_DA_PAGINA_COM_TOKEN}>{rotulo}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function ResumoDaProposta({ amount, dateLong, validUntil, expired, location, details, sentAt }: Propriedades) {
  return (
    <section aria-labelledby="proposta-resumo" className={cn(CARTAO_DA_PAGINA_COM_TOKEN, "flex flex-col gap-4")}>
      <h2 id="proposta-resumo" className="sr-only">
        Resumo da proposta
      </h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Dado rotulo="Valor" larga>
          <span className="font-num text-4xl leading-tight">{formatarReaisDoPainel(amount)}</span>
        </Dado>
        <Dado rotulo="Data do casamento">
          <span className="text-[17px] font-semibold">{dateLong ?? "A definir"}</span>
        </Dado>
        <Dado rotulo="Validade">
          <span className={cn("text-[17px] font-semibold", expired && "text-perigo")}>{validUntil ? `Até ${validUntil}` : "Sem prazo definido"}</span>
        </Dado>
        {location ? (
          <Dado rotulo="Cidade" larga>
            <span className="text-[17px] font-semibold">{location}</span>
          </Dado>
        ) : null}
      </dl>
      {details ? (
        <div className="flex flex-col gap-1.5 border-t border-linha pt-4">
          <p className={SOBRETITULO_DA_PAGINA_COM_TOKEN}>O que está incluído</p>
          <p className="text-[15px] whitespace-pre-line break-words sm:text-base">{details}</p>
        </div>
      ) : null}
      <p className="text-[13px] text-tinta-suave">Enviada {formatarDataEHoraEmBrasilia(sentAt)}.</p>
    </section>
  );
}
