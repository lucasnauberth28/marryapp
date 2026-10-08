import type { Metadata } from "next";
import { AuthExperience } from "./auth-experience";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre para continuar organizando o casamento no Aceito.",
};

export default function LoginPage() {
  return <AuthExperience initialMode="entrar" />;
}
