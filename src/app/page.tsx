import { HomeLandingClient } from "./home-landing-client";

export const metadata = {
  title: "MarryApp — O Ecossistema Completo de Casamentos (Noivos, Assessores & Fornecedores)",
  description: "Crie o site do seu casamento, lista de presentes com saque via Pix, automações no WhatsApp e encontre fornecedores verificados na sua região.",
};

export default function Home() {
  return <HomeLandingClient />;
}
