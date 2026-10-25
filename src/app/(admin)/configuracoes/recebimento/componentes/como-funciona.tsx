import { Lock, ShieldCheck } from "lucide-react";
import { Cartao, CabecalhoDoCartao, ConteudoDoCartao, TituloDoCartao } from "@/components/ui/card";

export function ComoFunciona({ feeLabel }: { feeLabel: string }) {
  return (
    <Cartao className="gap-3">
      <CabecalhoDoCartao>
        <TituloDoCartao className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-ameixa" aria-hidden="true" />
          Como funciona
        </TituloDoCartao>
      </CabecalhoDoCartao>
      <ConteudoDoCartao className="flex flex-col gap-3 text-base leading-6 text-tinta">
        <p>
          Os presentes pagos pelo site chegam ao Aceito e depois são repassados para este destino. O Aceito retém {feeLabel} quando for o caso. O prazo e a
          forma do repasse serão informados antes de o recurso ser ativado.
        </p>
        <p>O cadastro já pode ser feito agora. O repasse em si será liberado pela equipe do Aceito, e nada é enviado por conta própria.</p>
        <p className="flex items-start gap-2 text-sm leading-5 text-tinta-suave">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Os dados ficam criptografados. Depois de salvos, mostramos só uma parte (por exemplo, o final da conta), e para cadastrar, trocar ou remover pedimos sua
          senha.
        </p>
      </ConteudoDoCartao>
    </Cartao>
  );
}
