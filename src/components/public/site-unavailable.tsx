import Link from "next/link";
import { estiloDoBotao } from "@/components/landing/styles";
import { TelaDeSituacao } from "@/components/feedback/status-screen";

/** Site de um casal suspenso pela administração: nada do casal aparece (nem nomes nem data). */
export function SiteIndisponivel() {
  return (
    <TelaDeSituacao
      glyph="!"
      eyebrow="Site do casal"
      title="Este site está indisponível no momento"
      description="O endereço existe, mas o casal não está recebendo visitas por aqui agora. Se você tem o contato dos noivos, fale com eles diretamente."
      actions={
        <Link href="/" className={estiloDoBotao.secondary}>
          Conhecer o Aceito
        </Link>
      }
    />
  );
}
