import Link from "next/link";
import { ROTULO_DA_TAXA_DO_PRESENTE } from "@/lib/gift-fee";
import { GiftSimulator } from "./gift-simulator";
import { Reveal } from "@/components/motion/reveal";
import { SectionHead } from "./home-ui";

/** Presentes em dinheiro: seção escura com o simulador. */
export function GiftsSection({ classic, vip }: { classic: string; vip: string }) {
  return (
    <section className="lp-escuro lp-sec" id="presentes" aria-labelledby="lp-t-sim">
      <div className="lp-moldura">
        <SectionHead
          id="lp-t-sim"
          chip="Presentes em dinheiro"
          title="Simulem e vejam quanto"
          accent="vocês recebem de verdade."
          lead="Pix sem acréscimo para quem presenteia. No cartão, a tarifa aparece antes de pagar."
        />
        <Reveal variant="scale" delay={100}>
          <GiftSimulator classicLabel={classic} vipLabel={vip} />
        </Reveal>
        <p className="lp-sim-nota">
          No {classic} e no {vip}, a taxa de {ROTULO_DA_TAXA_DO_PRESENTE} não vale para Pix, só para cartão.{" "}
          <Link href="/planos#presentes" className="lp-link-claro">
            Ver taxas e condições
          </Link>
        </p>
      </div>
    </section>
  );
}
