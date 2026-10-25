import { redirect } from "next/navigation";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { temAcessoAoCaminho } from "@/lib/permissions";

export const metadata = { title: "Presentes e dinheiro" };

// A Carteira deixou de ser uma tela do menu: o dinheiro dos presentes (recebido, taxa, líquido e Pix a conferir) mora
// em Presentes e dinheiro. O endereço antigo continua valendo (links salvos, avisos) e leva para lá.
export default async function CarteiraPage() {
  const { session } = await requireWeddingPage("/carteira");
  redirect(temAcessoAoCaminho(session.allowedPaths, "/presentes-admin") ? "/presentes-admin" : "/dashboard");
}
