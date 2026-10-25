import { obterCatalogo } from "@/lib/catalog-server";
import { CustomPlanClient } from "./custom-plan-client";

// Os preços dos recursos vêm do catálogo da administração: a página se refaz a cada 5 minutos e na hora que um preço muda.
export const revalidate = 300;

export const metadata = {
  title: "Montem o plano de vocês",
  description: "Escolham só os recursos que vão usar e paguem uma vez, sem mensalidade. Quanto mais recursos, maior o desconto.",
};

export default async function CustomPlanPage() {
  const catalog = await obterCatalogo();
  // O servidor sempre recalcula o preço ao cobrar: o que aparece aqui é só a prévia.
  return <CustomPlanClient modules={catalog.modules} />;
}
