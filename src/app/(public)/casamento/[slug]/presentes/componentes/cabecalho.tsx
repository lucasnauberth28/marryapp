import { CreditCard, QrCode, ShieldCheck } from "lucide-react";

export function CabecalhoDosPresentes({ coupleNames, cardEnabled }: { coupleNames: string; cardEnabled: boolean }) {
  return (
    <section aria-labelledby="presentes-titulo" className="flex flex-col gap-3 pb-6 pt-8 sm:pt-14">
      <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">Presentes em dinheiro</p>
      <h1 id="presentes-titulo" className="font-display text-[36px] font-medium leading-[1.08] tracking-[-0.015em] text-balance text-tinta sm:text-[clamp(36px,4.5vw,56px)]">
        Um carinho para a vida nova
      </h1>
      <p className="max-w-[60ch] text-[17px] leading-[26px] text-tinta-suave sm:text-lg sm:leading-7">
        A presença de vocês já é o nosso maior presente. Se quiserem nos ajudar a começar essa nova fase, escolham um item abaixo e paguem por Pix{cardEnabled ? " ou cartão" : ""}. Cada presente representa um valor em dinheiro para o casal, sem entrega de produto. {coupleNames} são avisados de quem presenteou.
      </p>
      <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-2 text-sm text-tinta-suave">
        <li className="flex items-center gap-1.5">
          <QrCode aria-hidden="true" className="size-4 text-sucesso" strokeWidth={1.6} />
          Pix sem taxa para quem presenteia
        </li>
        {cardEnabled ? (
          <li className="flex items-center gap-1.5">
            <CreditCard aria-hidden="true" className="size-4 text-ameixa" strokeWidth={1.6} />
            Cartão em até 12x
          </li>
        ) : null}
        <li className="flex items-center gap-1.5">
          <ShieldCheck aria-hidden="true" className="size-4 text-ameixa" strokeWidth={1.6} />
          Pagamento seguro
        </li>
      </ul>
    </section>
  );
}
