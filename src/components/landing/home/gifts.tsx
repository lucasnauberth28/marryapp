import Link from "next/link";
import { SimuladorDePresentes } from "./gift-simulator";
import { Aparicao } from "@/components/motion/reveal";
import { CabecalhoDaSecao } from "./home-ui";

/** Presentes em dinheiro: seção escura com o simulador. */
export function SecaoDePresentes({ classic, vip }: { classic: string; vip: string }) {
  return (
    <section className="lp-escuro lp-sec" id="presentes" aria-labelledby="lp-t-sim">
      <div className="lp-moldura">
        <CabecalhoDaSecao
          id="lp-t-sim"
          chip="Presentes em dinheiro"
          title="Simulem e vejam quanto"
          accent="vocês recebem de verdade."
          lead="Pix sem acréscimo para quem presenteia. No cartão, a tarifa aparece antes de pagar."
        />
        <Aparicao variant="scale" delay={100}>
          <SimuladorDePresentes classicLabel={classic} vipLabel={vip} />
        </Aparicao>
        <p className="lp-sim-nota">
          No {classic} e no {vip}, o Pix não tem tarifa do Aceito. As condições de cada plano aparecem na hora de escolher.{" "}
          <Link href="/planos#presentes" className="lp-link-claro">
            Comparar os planos
          </Link>
        </p>
      </div>
    </section>
  );
}
