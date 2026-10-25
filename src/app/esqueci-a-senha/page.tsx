import type { Metadata } from "next";
import Link from "next/link";
import { MoldeDeAcesso, FOTOS_DO_MOLDE } from "@/components/account/auth-shell";
import { FormularioDeEsqueciASenha } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueci a senha",
  description: "Receba por e-mail um link para criar uma nova senha no Aceito.",
  robots: { index: false, follow: false },
};

export default function EsqueciASenhaPage() {
  return (
    <MoldeDeAcesso
      photo={FOTOS_DO_MOLDE.senha}
      backHref="/login"
      backLabel="Voltar para o login"
      footnote={
        <>
          Lembrou a senha?{" "}
          <Link href="/login" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 hover:decoration-ameixa">
            Entrar
          </Link>
        </>
      }
    >
      <FormularioDeEsqueciASenha />
    </MoldeDeAcesso>
  );
}
