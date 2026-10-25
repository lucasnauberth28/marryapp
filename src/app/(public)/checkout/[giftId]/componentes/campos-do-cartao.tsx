import { Campo } from "@/components/ui/field";
import { SelecaoNativa } from "@/components/ui/select";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { cn } from "@/lib/utils";
import type { CartaoDigitado } from "./use-dados-do-pagamento";

function mascararValidade(texto: string) {
  const raw = somenteDigitos(texto).substring(0, 4);
  return raw.length >= 3 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
}

function ValidadeECodigo({ cartao }: { cartao: CartaoDigitado }) {
  return (
    <>
      <Campo id="cartao-validade" label="Validade (MM/AA)">
        {(c) => (
          <input {...c} id="cartao-validade" inputMode="numeric" autoComplete="cc-exp" value={cartao.cardExpiry} onChange={(e) => cartao.setCardExpiry(mascararValidade(e.target.value))} placeholder="MM/AA" maxLength={5} className={cn(c.className, "font-mono")} />
        )}
      </Campo>

      <Campo id="cartao-cvv" label="Código (CVV)">
        {(c) => (
          <input
            {...c}
            id="cartao-cvv"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={cartao.cardCvv}
            onChange={(e) => cartao.setCardCvv(somenteDigitos(e.target.value).substring(0, 4))}
            placeholder="123"
            maxLength={4}
            className={cn(c.className, "font-mono")}
          />
        )}
      </Campo>
    </>
  );
}

export function CamposDoCartao({ cartao, valorTotal }: { cartao: CartaoDigitado; valorTotal: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5">
      <Campo id="cartao-email" label="E-mail para o comprovante" className="col-span-2">
        {(c) => <input {...c} id="cartao-email" type="email" autoComplete="email" value={cartao.payerEmail} onChange={(e) => cartao.setPayerEmail(e.target.value)} placeholder="voce@email.com" />}
      </Campo>

      <Campo id="cartao-nome" label="Nome como está no cartão" className="col-span-2">
        {(c) => <input {...c} id="cartao-nome" autoComplete="cc-name" value={cartao.cardName} onChange={(e) => cartao.setCardName(e.target.value.toUpperCase())} placeholder="JOAO M SILVA" />}
      </Campo>

      <Campo id="cartao-numero" label="Número do cartão" className="col-span-2">
        {(c) => (
          <input
            {...c}
            id="cartao-numero"
            inputMode="numeric"
            autoComplete="cc-number"
            value={cartao.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}
            onChange={(e) => cartao.setCardNumber(somenteDigitos(e.target.value).substring(0, 16))}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            className={cn(c.className, "font-mono tracking-wider")}
          />
        )}
      </Campo>

      <ValidadeECodigo cartao={cartao} />

      {/* Parcelas (máx. 12x) */}
      <SelecaoNativa id="cartao-parcelas" label="Parcelas" fieldClassName="col-span-2" value={cartao.installments} onChange={(e) => cartao.setInstallments(Number(e.target.value))}>
        {[...Array(12)].map((_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}x de {formatarReais(Math.round(valorTotal / (i + 1)))}
          </option>
        ))}
      </SelecaoNativa>
    </div>
  );
}
