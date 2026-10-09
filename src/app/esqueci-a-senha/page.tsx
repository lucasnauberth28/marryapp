import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, SHELL_PHOTOS } from "@/components/account/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueci a senha",
  description: "Receba por e-mail um link para criar uma nova senha no Aceito.",
  robots: { index: false, follow: false },
};

export default function EsqueciASenhaPage() {
  return (
    <AuthShell
      photo={SHELL_PHOTOS.senha}
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
      <ForgotPasswordForm />
    </AuthShell>
  );
}
