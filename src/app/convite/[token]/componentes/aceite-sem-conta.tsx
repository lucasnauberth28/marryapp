import { useState, useTransition } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { aceitarConviteComContaNova } from "@/actions/invite-actions";
import { entrar } from "@/actions/auth-actions";
import { estiloDoBotao, estiloDoBotaoComSeta } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { Campo, AvisoDoFormulario } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Modo = "criar" | "entrar";
type Erros = Partial<Record<"name" | "email" | "password", string>>;
type ErroGeral = { message: string; existingAccount?: boolean };

const MODOS = [
  ["criar", "Criar minha conta"],
  ["entrar", "Já tenho conta"],
] as const;

function conferirCampos(mode: Modo, name: string, email: string, password: string): Erros {
  const found: Erros = {};
  if (mode === "criar" && name.trim().length < 3) found.name = "Informe seu nome completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = "Confira o e-mail.";
  if (mode === "criar" ? password.length < 8 : password.length === 0) found.password = mode === "criar" ? "Use pelo menos 8 caracteres." : "Informe sua senha.";
  return found;
}

function useAceiteSemConta(token: string) {
  const [mode, setMode] = useState<Modo>("criar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Erros>({});
  const [error, setError] = useState<ErroGeral | null>(null);
  const [isPending, startTransition] = useTransition();

  const switchMode = (to: Modo) => {
    setMode(to);
    setErrors({});
    setError(null);
  };

  const enviar = async () => {
    const emailLimpo = email.trim().toLowerCase();
    if (mode === "criar") {
      const res = await aceitarConviteComContaNova({ token, name, email: emailLimpo, password });
      if (res.success) window.location.href = res.redirectTo;
      else setError({ message: res.error, existingAccount: "existingAccount" in res ? res.existingAccount : false });
      return;
    }
    const res = await entrar(password, emailLimpo);
    // Com a sessão criada, a página volta mostrando "Entrar neste casamento".
    if (res.success) window.location.reload();
    else setError({ message: res.error || "E-mail ou senha não conferem." });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const found = conferirCampos(mode, name, email, password);
    setErrors(found);
    const first = (["name", "email", "password"] as const).find((k) => found[k]);
    if (first) return void document.getElementById(`convite-${first}`)?.focus();
    startTransition(async () => {
      try {
        await enviar();
      } catch {
        setError({ message: "Não conseguimos falar com o servidor. Tente de novo em instantes." });
      }
    });
  };

  return { mode, switchMode, name, setName, email, setEmail, password, setPassword, errors, error, isPending, handleSubmit };
}

function AlternarVisibilidade({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-label={show ? "Ocultar senha" : "Mostrar senha"} aria-pressed={show} className="grid size-11 cursor-pointer place-items-center rounded-[10px] text-tinta-suave transition-colors hover:bg-areia hover:text-tinta">
      {show ? <EyeOff aria-hidden="true" className="size-[18px]" strokeWidth={1.6} /> : <Eye aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />}
    </button>
  );
}

function EscolhaDoModo({ mode, aoEscolher }: { mode: Modo; aoEscolher: (m: Modo) => void }) {
  return (
    <div role="tablist" aria-label="Como continuar" className="grid grid-cols-2 gap-1 rounded-[12px] bg-areia p-1">
      {MODOS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={mode === key}
          onClick={() => aoEscolher(key)}
          className={cn(
            "flex min-h-11 cursor-pointer items-center justify-center rounded-[10px] font-semibold transition-[background-color,color,box-shadow] duration-300 ease-[var(--ease-aceito)]",
            mode === key ? "bg-papel text-tinta shadow-[var(--shadow-aceito-1)]" : "text-tinta-suave hover:bg-papel/60 hover:text-tinta",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function CamposDoAceite({ f, criando }: { f: ReturnType<typeof useAceiteSemConta>; criando: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <>
  {criando ? (
    <Campo id="convite-name" label="Seu nome completo" icon={User} error={f.errors.name}>
      {(c) => <input {...c} id="convite-name" autoComplete="name" maxLength={120} value={f.name} onChange={(e) => f.setName(e.target.value)} />}
    </Campo>
  ) : null}
  <Campo id="convite-email" label="E-mail" icon={Mail} error={f.errors.email}>
    {(c) => <input {...c} id="convite-email" type="email" autoComplete={criando ? "email" : "username"} autoCapitalize="none" spellCheck={false} placeholder="voce@email.com" value={f.email} onChange={(e) => f.setEmail(e.target.value)} />}
  </Campo>
  <Campo id="convite-password" label={criando ? "Crie uma senha" : "Senha"} icon={Lock} error={f.errors.password} hint={criando ? "Pelo menos 8 caracteres." : undefined} trailing={<AlternarVisibilidade show={show} onToggle={() => setShow((v) => !v)} />}>
    {(c) => <input {...c} id="convite-password" type={show ? "text" : "password"} autoComplete={criando ? "new-password" : "current-password"} value={f.password} onChange={(e) => f.setPassword(e.target.value)} />}
  </Campo>
    </>
  );
}

const LINK_DE_TEXTO = "font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4";

export function AceiteDeQuemNaoTemConta({ token }: { token: string }) {
  const f = useAceiteSemConta(token);
  const criando = f.mode === "criar";

  return (
    <div className="flex flex-col gap-5">
      <EscolhaDoModo mode={f.mode} aoEscolher={f.switchMode} />

      <form onSubmit={f.handleSubmit} noValidate className="flex flex-col gap-5">
        <CamposDoAceite f={f} criando={criando} />

        {f.error ? (
          <AvisoDoFormulario>
            <p>{f.error.message}</p>
            {f.error.existingAccount ? (
              <button type="button" onClick={() => f.switchMode("entrar")} className="mt-1 font-semibold text-ameixa underline underline-offset-4">
                Entrar com este e-mail
              </button>
            ) : null}
          </AvisoDoFormulario>
        ) : null}

        <Botao type="submit" loading={f.isPending} className="h-12 w-full rounded-[12px] px-6">
          {criando ? "Criar conta e entrar no casamento" : "Entrar"}
          <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
        </Botao>

        {criando ? (
          <p className="text-center text-sm leading-5 text-tinta-suave">
            Ao criar a conta, você concorda com os{" "}
            <a href="/termos" target="_blank" className={LINK_DE_TEXTO}>
              termos de uso
            </a>{" "}
            e a{" "}
            <a href="/privacidade" target="_blank" className={LINK_DE_TEXTO}>
              política de privacidade
            </a>
            .
          </p>
        ) : (
          <a href="/esqueci-a-senha" className={cn(estiloDoBotao.quiet, "self-center")}>
            Esqueci a senha
          </a>
        )}
      </form>
    </div>
  );
}
