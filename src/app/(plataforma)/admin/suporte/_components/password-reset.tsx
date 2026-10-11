"use client";

import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/field";
import { Panel } from "@/components/plataforma/panel";
import { btn } from "@/components/landing/styles";
import { sendSupportPasswordReset } from "@/actions/admin-suporte-actions";
import { useAdminAction } from "../../_sistema/use-admin-action";

/** Esqueci a senha: manda o link de redefinição ao e-mail da pessoa. A resposta é sempre a mesma e o link nunca aparece. */
export function PasswordReset() {
  const [email, setEmail] = useState("");
  const { pending, errors, formError, run } = useAdminAction();
  return (
    <Panel title="Esqueci a senha" description="Para quando a pessoa não recebe o e-mail de redefinição.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => sendSupportPasswordReset({ email }), () => setEmail(""));
        }}
      >
        <Input label="E-mail da pessoa" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="off" />
        <p className="flex items-start gap-2 rounded-xl bg-areia px-3 py-2.5 text-sm leading-5 text-tinta">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>O link vale por 1 hora e vai só para o e-mail da conta. Ele não aparece aqui e o envio fica no registro. Nunca peça a senha para ninguém.</span>
        </p>
        {formError && !Object.keys(errors).length && <FormAlert>{formError}</FormAlert>}
        <div>
          <button type="submit" disabled={pending || email.trim().length < 5} className={btn.primary}>
            <Mail className="size-4" aria-hidden="true" /> Enviar link de redefinição
          </button>
        </div>
      </form>
    </Panel>
  );
}
