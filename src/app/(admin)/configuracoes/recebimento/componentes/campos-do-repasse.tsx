import { KeyRound, Landmark, Lock } from "lucide-react";
import { Entrada } from "@/components/ui/input";
import { SelecaoNativa } from "@/components/ui/select";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import { ROTULO_DO_TIPO_DE_CHAVE_PIX, ROTULO_DO_TIPO_DE_CONTA_BANCARIA, TIPOS_DE_CHAVE_PIX, TIPOS_DE_CONTA_BANCARIA, type TipoDeChavePix, type TipoDeContaBancaria } from "@/lib/repasse/payout-input";
import { cn } from "@/lib/utils";
import type { FormularioDeRepasseEmEdicao } from "./use-formulario-de-repasse";

type Formulario = { uid: string; form: FormularioDeRepasseEmEdicao };

/** Escolha entre receber por Pix ou por conta bancária. */
export function EscolhaDoTipo({ uid, form }: Formulario) {
  const opcao = (value: "PIX_KEY" | "BANK_ACCOUNT", label: string, Icon: typeof KeyRound) => (
    <label key={value} className="relative min-w-0">
      <input type="radio" name={`${uid}-tipo`} value={value} checked={form.campos.kind === value} onChange={() => form.mudar("kind", value)} className="peer sr-only" />
      <span
        className={cn(
          "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[8px] px-4 text-center text-base font-semibold text-tinta-suave transition-colors hover:text-tinta",
          "peer-checked:bg-papel peer-checked:text-ameixa peer-checked:shadow-[var(--shadow-aceito-1)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-ameixa",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </span>
    </label>
  );
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-semibold leading-5 text-tinta-suave">Como vocês querem receber</legend>
      <div className="grid w-full grid-cols-2 gap-1 rounded-[12px] border border-linha bg-areia p-1 sm:inline-grid sm:w-auto sm:grid-flow-col sm:grid-cols-none">
        {opcao("PIX_KEY", "Pix", KeyRound)}
        {opcao("BANK_ACCOUNT", "Conta bancária", Landmark)}
      </div>
    </fieldset>
  );
}

export function DadosDoTitular({ uid, form }: Formulario) {
  const { campos, mudar } = form;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Entrada id={`${uid}-nome`} label="Nome completo do titular" autoComplete="off" value={campos.holderName} onChange={(e) => mudar("holderName", e.target.value)} maxLength={120} required />
      <Entrada id={`${uid}-doc`} label="CPF ou CNPJ do titular" autoComplete="off" inputMode="text" value={campos.holderDocument} onChange={(e) => mudar("holderDocument", e.target.value)} maxLength={30} required hint="Precisa ser do mesmo titular da chave ou da conta." />
    </div>
  );
}

export function CamposDoPix({ uid, form }: Formulario) {
  const { campos, mudar } = form;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelecaoNativa id={`${uid}-tipochave`} label="Tipo da chave" value={campos.pixKeyType} onChange={(e) => mudar("pixKeyType", e.target.value as TipoDeChavePix)}>
        {TIPOS_DE_CHAVE_PIX.map((t) => (
          <option key={t} value={t}>
            {ROTULO_DO_TIPO_DE_CHAVE_PIX[t]}
          </option>
        ))}
      </SelecaoNativa>
      <Entrada
        id={`${uid}-chave`}
        label="Chave Pix"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={campos.pixKey}
        onChange={(e) => mudar("pixKey", e.target.value)}
        maxLength={120}
        required
        hint={campos.pixKeyType === "CPF" || campos.pixKeyType === "CNPJ" ? "Tem de ser o mesmo documento do titular." : undefined}
      />
    </div>
  );
}

export function CamposDaContaBancaria({ uid, form }: Formulario) {
  const { campos, mudar } = form;
  const digitos = (campo: "bankCode" | "agency" | "account", limite: number) => (e: React.ChangeEvent<HTMLInputElement>) => mudar(campo, somenteDigitos(e.target.value).slice(0, limite));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Entrada id={`${uid}-banco`} label="Código do banco" inputMode="numeric" autoComplete="off" value={campos.bankCode} onChange={digitos("bankCode", 3)} required hint="3 números, como 260 ou 001." />
      <Entrada id={`${uid}-agencia`} label="Agência" inputMode="numeric" autoComplete="off" value={campos.agency} onChange={digitos("agency", 5)} required hint="Sem o dígito." />
      <Entrada id={`${uid}-conta`} label="Conta" inputMode="numeric" autoComplete="off" value={campos.account} onChange={digitos("account", 12)} required hint="Sem o dígito." />
      <Entrada id={`${uid}-digito`} label="Dígito da conta" autoComplete="off" value={campos.accountDigit} onChange={(e) => mudar("accountDigit", e.target.value.slice(0, 2))} optional />
      <SelecaoNativa id={`${uid}-tipoconta`} label="Tipo da conta" value={campos.accountKind} onChange={(e) => mudar("accountKind", e.target.value as TipoDeContaBancaria)}>
        {TIPOS_DE_CONTA_BANCARIA.map((t) => (
          <option key={t} value={t}>
            {ROTULO_DO_TIPO_DE_CONTA_BANCARIA[t]}
          </option>
        ))}
      </SelecaoNativa>
    </div>
  );
}

export function SenhaDeProtecao({ uid, form }: Formulario) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-linha bg-linho p-4 sm:p-5">
      <p className="flex items-start gap-2 text-sm leading-5 text-tinta-suave">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Para proteger o dinheiro de vocês, confirme com a sua senha do Aceito.
      </p>
      <Entrada id={`${uid}-senha`} label="Sua senha do Aceito" type="password" autoComplete="current-password" value={form.campos.password} onChange={(e) => form.mudar("password", e.target.value)} required fieldClassName="sm:max-w-[360px]" />
    </div>
  );
}
