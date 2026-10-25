import { Phone } from "lucide-react";
import { Botao } from "@/components/ui/button";
import { Campo } from "@/components/ui/field";
import { mascararTelefone } from "@/lib/formatacao/telefone";
import { estiloDoSobretitulo, estiloDoTitulo, type PropriedadesDaEtapa } from "./tipos";
import type { Confirmacao } from "./use-confirmacao";

export function EtapaDeBusca({ titulo, c }: PropriedadesDaEtapa & { c: Confirmacao }) {
  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className={estiloDoSobretitulo}>Confirmação de presença</p>
        <h1 ref={titulo} id="titulo" tabIndex={-1} className={estiloDoTitulo}>
          Vamos achar o seu convite
        </h1>
        <p className="text-tinta-suave">Digite o seu WhatsApp com DDD, o mesmo que os noivos têm de você. Você verá só o seu convite.</p>
      </div>
      <form onSubmit={c.buscar} className="flex flex-col gap-6">
        <Campo id="rsvp-telefone" label="Seu WhatsApp com DDD" icon={Phone} error={c.error || undefined}>
          {(campo) => (
            <input
              {...campo}
              id="rsvp-telefone"
              type="tel"
              name="phone"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(11) 99999-9999"
              value={c.phone}
              onChange={(e) => c.setPhone(mascararTelefone(e.target.value))}
              required
            />
          )}
        </Campo>
        <Botao type="submit" loading={c.loading} className="h-12 w-full rounded-[12px] px-6">
          Encontrar meu convite
        </Botao>
      </form>
      <p className="text-sm text-tinta-suave">Não achou o seu convite? Fale com os noivos, eles ajudam.</p>
    </section>
  );
}
