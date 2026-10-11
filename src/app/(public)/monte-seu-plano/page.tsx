import { getCatalog } from "@/lib/catalog-server";
import { CustomPlanClient } from "./custom-plan-client";

// Os preços dos recursos vêm do catálogo da administração: a página se refaz a cada 5 minutos e na hora que um preço muda.
export const revalidate = 300;

export const metadata = {
  title: "Monte seu Plano Sob Medida | Aceito",
  description:
    "Personalize os recursos do seu casamento e pague apenas pelo que for utilizar com taxa zero no Pix e descontos progressivos.",
};

export default async function CustomPlanPage() {
  const catalog = await getCatalog();
  // O servidor sempre recalcula o preço ao cobrar: o que aparece aqui é só a prévia.
  return <CustomPlanClient modules={catalog.modules} />;
}
