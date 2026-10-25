"use client";

import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, KeyRound, Landmark, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { confirmPayoutAccount, removePayoutAccount, savePayoutAccount, type PayoutResponse } from "@/actions/payout-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { BANK_ACCOUNT_KIND_LABEL, BANK_ACCOUNT_KINDS, PIX_KEY_TYPE_LABEL, PIX_KEY_TYPES, type BankAccountKind, type PixKeyType } from "@/lib/payout-input";
import { cn } from "@/lib/utils";

import { somenteDigitos } from "@/lib/formatacao/telefone";
interface AccountMask {
  type: "PIX_KEY" | "BANK_ACCOUNT";
  holderName: string;
  holderDocumentHint: string;
  keyHint: string;
  verifiedAt: string | null;
  updatedAt: string;
}

interface Props {
  account: AccountMask | null;
  /** Motivo de a pessoa só poder olhar (administração vendo o casal, casamento suspenso), ou null. */
  blockedReason: string | null;
  registrationAvailable: boolean;
  feeLabel: string;
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

type Mode = "view" | "form" | "confirm" | "remove";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm font-semibold leading-5 text-tinta-suave">{label}</dt>
      <dd className="min-w-0 break-words text-base leading-6 text-tinta">{children}</dd>
    </div>
  );
}

export function RecebimentoClient({ account: initial, blockedReason, registrationAvailable, feeLabel }: Props) {
  const [account, setAccount] = useState<AccountMask | null>(initial);
  const [mode, setMode] = useState<Mode>("view");
  const readOnly = blockedReason !== null;

  function applyResult(res: PayoutResponse, success: string): boolean {
    if (!res.success) return false;
    setAccount(
      res.account
        ? {
            ...res.account,
            verifiedAt: res.account.verifiedAt ? new Date(res.account.verifiedAt).toISOString() : null,
            updatedAt: new Date(res.account.updatedAt).toISOString(),
          }
        : null,
    );
    setMode("view");
    toast.success(success);
    return true;
  }

  return (
    <>
      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-ameixa" aria-hidden="true" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-base leading-6 text-tinta">
          <p>
            Os presentes pagos pelo site chegam ao Aceito e depois são repassados para este destino. O Aceito retém {feeLabel} quando for o caso. O prazo e a
            forma do repasse serão informados antes de o recurso ser ativado.
          </p>
          <p>O cadastro já pode ser feito agora. O repasse em si será liberado pela equipe do Aceito, e nada é enviado por conta própria.</p>
          <p className="flex items-start gap-2 text-sm leading-5 text-tinta-suave">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Os dados ficam criptografados. Depois de salvos, mostramos só uma parte (por exemplo, o final da conta), e para cadastrar, trocar ou remover pedimos sua
            senha.
          </p>
        </CardContent>
      </Card>

      {readOnly && (
        <p role="status" className="rounded-2xl border border-aviso/40 bg-aviso-suave px-4 py-3.5 text-sm leading-5 text-tinta">
          {blockedReason}
        </p>
      )}

      {account && mode !== "form" && (
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Destino cadastrado</CardTitle>
            <CardDescription>Atualizado em {dateFmt.format(new Date(account.updatedAt))}.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact label={account.type === "PIX_KEY" ? "Chave Pix" : "Conta bancária"}>
                <span className="inline-flex items-center gap-2">
                  {account.type === "PIX_KEY" ? <KeyRound className="size-4 text-ameixa" aria-hidden="true" /> : <Landmark className="size-4 text-ameixa" aria-hidden="true" />}
                  {account.keyHint}
                </span>
              </Fact>
              <Fact label="Titular">
                {account.holderName}
                <span className="block text-sm text-tinta-suave">{account.holderDocumentHint}</span>
              </Fact>
              <Fact label="Situação">
                {account.verifiedAt ? (
                  <span className="inline-flex items-center gap-2 font-semibold text-sucesso">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Confirmado em {dateFmt.format(new Date(account.verifiedAt))}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 font-semibold text-aviso">
                    <Clock className="size-4" aria-hidden="true" />
                    Falta confirmar que está certo
                  </span>
                )}
              </Fact>
            </dl>

            {mode === "view" && !readOnly && (
              <div className="flex flex-wrap gap-2">
                {!account.verifiedAt && <Button onClick={() => setMode("confirm")}>Confirmar que está certo</Button>}
                <Button variant={account.verifiedAt ? "default" : "outline"} onClick={() => setMode("form")} disabled={!registrationAvailable}>
                  Trocar os dados
                </Button>
                <Button variant="quiet" onClick={() => setMode("remove")}>
                  Remover
                </Button>
              </div>
            )}

            {mode === "confirm" && (
              <PasswordStep
                title="Confirmar os dados"
                help="Ao confirmar, você diz ao Aceito que o destino acima é o certo. Pedimos sua senha para proteger essa decisão."
                submitLabel="Confirmar"
                pendingToast="Confirmando…"
                onCancel={() => setMode("view")}
                run={(password) => confirmPayoutAccount({ password })}
                onDone={(res) => applyResult(res, "Dados confirmados.")}
              />
            )}
            {mode === "remove" && (
              <PasswordStep
                title="Remover os dados de recebimento"
                help="Vamos apagar o destino cadastrado, inclusive a parte criptografada. Vocês poderão cadastrar de novo quando quiserem."
                submitLabel="Remover"
                danger
                pendingToast="Removendo…"
                onCancel={() => setMode("view")}
                run={(password) => removePayoutAccount({ password })}
                onDone={(res) => applyResult(res, "Dados de recebimento removidos.")}
              />
            )}
          </CardContent>
        </Card>
      )}

      {!account && !readOnly && mode === "view" && (
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Nenhum destino cadastrado</CardTitle>
            <CardDescription>Cadastre uma chave Pix ou uma conta em nome de uma pessoa ou empresa do casal.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!registrationAvailable && (
              <p role="status" className="rounded-xl border border-aviso/40 bg-aviso-suave px-4 py-3 text-sm leading-5 text-tinta">
                O cadastro ainda não foi liberado. A equipe do Aceito está terminando a configuração de segurança; volte em breve.
              </p>
            )}
            <div>
              <Button onClick={() => setMode("form")} disabled={!registrationAvailable}>
                Cadastrar onde receber
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!account && readOnly && (
        <Card className="gap-2">
          <CardHeader>
            <CardTitle>Nenhum destino cadastrado</CardTitle>
            <CardDescription>O casal ainda não informou onde receber os presentes.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {mode === "form" && !readOnly && (
        <PayoutForm
          replacing={Boolean(account)}
          onCancel={() => setMode("view")}
          onSaved={(res) => applyResult(res, account ? "Dados trocados. Falta confirmar que estão certos." : "Dados cadastrados. Falta confirmar que estão certos.")}
        />
      )}

      <p className="text-sm leading-5 text-tinta-suave">
        Quer entender a taxa e os planos? Veja em{" "}
        <Link href="/plano" className="font-semibold text-ameixa underline underline-offset-4">
          Plano e pagamentos
        </Link>
        .
      </p>
    </>
  );
}

/** Pede só a senha (confirmar ou remover). A senha nunca fica guardada: some do estado ao terminar. */
function PasswordStep({
  title,
  help,
  submitLabel,
  danger,
  pendingToast,
  onCancel,
  run,
  onDone,
}: {
  title: string;
  help: string;
  submitLabel: string;
  danger?: boolean;
  pendingToast: string;
  onCancel: () => void;
  run: (password: string) => Promise<PayoutResponse>;
  onDone: (res: PayoutResponse) => boolean;
}) {
  const uid = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const toastId = toast.loading(pendingToast);
    startTransition(async () => {
      const res = await run(password);
      setPassword("");
      toast.dismiss(toastId);
      if (!res.success) setError(res.error);
      else onDone(res);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-linha bg-linho p-4 sm:p-5" aria-label={title}>
      <div>
        <h2 className="text-lg font-semibold leading-6 text-tinta">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-tinta-suave">{help}</p>
      </div>
      <Input
        id={`${uid}-senha`}
        label="Sua senha do Aceito"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error ?? undefined}
        fieldClassName="sm:max-w-[360px]"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant={danger ? "danger" : "default"} loading={pending} disabled={password.length === 0}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function PayoutForm({ replacing, onCancel, onSaved }: { replacing: boolean; onCancel: () => void; onSaved: (res: PayoutResponse) => boolean }) {
  const uid = useId();
  const [kind, setKind] = useState<"PIX_KEY" | "BANK_ACCOUNT">("PIX_KEY");
  const [holderName, setHolderName] = useState("");
  const [holderDocument, setHolderDocument] = useState("");
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>("CPF");
  const [pixKey, setPixKey] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [agency, setAgency] = useState("");
  const [account, setAccount] = useState("");
  const [accountDigit, setAccountDigit] = useState("");
  const [accountKind, setAccountKind] = useState<BankAccountKind>("CORRENTE");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const common = { holderName, holderDocument, password };
    const payload =
      kind === "PIX_KEY"
        ? { type: "PIX_KEY", ...common, pixKeyType, pixKey }
        : { type: "BANK_ACCOUNT", ...common, bankCode, agency, account, accountDigit, accountKind };
    const toastId = toast.loading("Salvando…");
    startTransition(async () => {
      const res = await savePayoutAccount(payload);
      toast.dismiss(toastId);
      setPassword("");
      if (!res.success) {
        setError(res.error);
        return;
      }
      // Limpa o que foi digitado: o navegador não precisa guardar o dado depois de salvo.
      setPixKey("");
      setHolderDocument("");
      setAccount("");
      setAccountDigit("");
      onSaved(res);
    });
  }

  const choice = (value: "PIX_KEY" | "BANK_ACCOUNT", label: string, Icon: typeof KeyRound) => (
    <label key={value} className="relative min-w-0">
      <input type="radio" name={`${uid}-tipo`} value={value} checked={kind === value} onChange={() => setKind(value)} className="peer sr-only" />
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
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>{replacing ? "Trocar os dados de recebimento" : "Cadastrar onde receber"}</CardTitle>
        <CardDescription>
          {replacing
            ? "Os dados novos substituem os atuais, e as pessoas do casamento recebem um aviso. Por segurança, não mostramos o que está salvo."
            : "Use uma chave Pix ou uma conta que esteja no nome de quem vai receber."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-6" autoComplete="off">
          <fieldset className="min-w-0">
            <legend className="mb-2 text-sm font-semibold leading-5 text-tinta-suave">Como vocês querem receber</legend>
            <div className="grid w-full grid-cols-2 gap-1 rounded-[12px] border border-linha bg-areia p-1 sm:inline-grid sm:w-auto sm:grid-flow-col sm:grid-cols-none">
              {choice("PIX_KEY", "Pix", KeyRound)}
              {choice("BANK_ACCOUNT", "Conta bancária", Landmark)}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input id={`${uid}-nome`} label="Nome completo do titular" autoComplete="off" value={holderName} onChange={(e) => setHolderName(e.target.value)} maxLength={120} required />
            <Input
              id={`${uid}-doc`}
              label="CPF ou CNPJ do titular"
              autoComplete="off"
              inputMode="text"
              value={holderDocument}
              onChange={(e) => setHolderDocument(e.target.value)}
              maxLength={30}
              required
              hint="Precisa ser do mesmo titular da chave ou da conta."
            />
          </div>

          {kind === "PIX_KEY" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <NativeSelect id={`${uid}-tipochave`} label="Tipo da chave" value={pixKeyType} onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}>
                {PIX_KEY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PIX_KEY_TYPE_LABEL[t]}
                  </option>
                ))}
              </NativeSelect>
              <Input
                id={`${uid}-chave`}
                label="Chave Pix"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                maxLength={120}
                required
                hint={pixKeyType === "CPF" || pixKeyType === "CNPJ" ? "Tem de ser o mesmo documento do titular." : undefined}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id={`${uid}-banco`} label="Código do banco" inputMode="numeric" autoComplete="off" value={bankCode} onChange={(e) => setBankCode(somenteDigitos(e.target.value).slice(0, 3))} required hint="3 números, como 260 ou 001." />
              <Input id={`${uid}-agencia`} label="Agência" inputMode="numeric" autoComplete="off" value={agency} onChange={(e) => setAgency(somenteDigitos(e.target.value).slice(0, 5))} required hint="Sem o dígito." />
              <Input id={`${uid}-conta`} label="Conta" inputMode="numeric" autoComplete="off" value={account} onChange={(e) => setAccount(somenteDigitos(e.target.value).slice(0, 12))} required hint="Sem o dígito." />
              <Input id={`${uid}-digito`} label="Dígito da conta" autoComplete="off" value={accountDigit} onChange={(e) => setAccountDigit(e.target.value.slice(0, 2))} optional />
              <NativeSelect id={`${uid}-tipoconta`} label="Tipo da conta" value={accountKind} onChange={(e) => setAccountKind(e.target.value as BankAccountKind)}>
                {BANK_ACCOUNT_KINDS.map((t) => (
                  <option key={t} value={t}>
                    {BANK_ACCOUNT_KIND_LABEL[t]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          <div className="flex flex-col gap-4 rounded-2xl border border-linha bg-linho p-4 sm:p-5">
            <p className="flex items-start gap-2 text-sm leading-5 text-tinta-suave">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Para proteger o dinheiro de vocês, confirme com a sua senha do Aceito.
            </p>
            <Input
              id={`${uid}-senha`}
              label="Sua senha do Aceito"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fieldClassName="sm:max-w-[360px]"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-perigo/40 bg-perigo-suave px-4 py-3 text-sm leading-5 text-perigo">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={pending}>
              {replacing ? "Salvar os novos dados" : "Salvar"}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
