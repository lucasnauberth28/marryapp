import Link from "next/link";
import { Info } from "lucide-react";
import { SecaoDaConfiguracao } from "./secao";

const TEXTOS = [
  { href: "/termos", label: "Termos de uso" },
  { href: "/privacidade", label: "Política de privacidade" },
];

export function SecaoDosTextosLegais() {
  return (
    <SecaoDaConfiguracao id="textos" title="Textos legais" description="Os textos estão no código do app; o aceite de quem se cadastra ainda não é registrado.">
      <ul className="divide-y divide-linha">
        {TEXTOS.map((l) => (
          <li key={l.href} className="flex items-center justify-between gap-3 py-3">
            <span className="text-[15px] font-semibold text-tinta">{l.label}</span>
            <Link href={l.href} target="_blank" rel="noopener" className="text-sm font-semibold text-ameixa underline underline-offset-2">
              Abrir a página atual
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-start gap-2 text-sm leading-5 text-tinta-suave">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Não há versões nem data de publicação registradas, e o cadastro não guarda qual versão a pessoa aceitou.
      </p>
    </SecaoDaConfiguracao>
  );
}

function LinhaDeTaxa({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 py-2.5">
      <dt className="text-tinta-suave">{rotulo}</dt>
      <dd className="font-semibold text-tinta">{children}</dd>
    </div>
  );
}

export function SecaoDePresentesETaxas() {
  const feePercent = process.env.MP_FEE_PERCENT?.trim();
  const feeFixed = process.env.MP_FEE_FIXED?.trim();
  return (
    <SecaoDaConfiguracao id="presentes" title="Presentes e taxas" description="Só leitura: a taxa vem das regras do plano e das variáveis do servidor.">
      <dl className="divide-y divide-linha text-[15px]">
        <LinhaDeTaxa rotulo="Plano Básico">3,99% por presente recebido</LinhaDeTaxa>
        <LinhaDeTaxa rotulo="Planos pagos (Classic e VIP)">0% no Pix</LinhaDeTaxa>
        <LinhaDeTaxa rotulo="Taxa do Mercado Pago repassada no checkout">
          {feePercent ? `${feePercent.replace(".", ",")}%` : "4,99% (padrão do código)"}
          {feeFixed && Number(feeFixed) > 0 ? ` + R$ ${feeFixed.replace(".", ",")}` : ""}
        </LinhaDeTaxa>
      </dl>
      <p className="mt-3 text-sm leading-5 text-tinta-suave">Para mudar, é preciso alterar as variáveis MP_FEE_PERCENT e MP_FEE_FIXED na Vercel (e o texto das páginas de planos).</p>
    </SecaoDaConfiguracao>
  );
}
