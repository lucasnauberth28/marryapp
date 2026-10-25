import { ArrowRight, CalendarHeart, Heart, User } from "lucide-react";
import { TituloDoMolde } from "@/components/account/auth-shell";
import { estiloDoBotao, estiloDoBotaoComSeta } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { Campo, AvisoDoFormulario } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { EscolhaDoModelo } from "./escolha-do-modelo";
import type { DadosDoInicio } from "./use-dados-do-inicio";

interface Propriedades {
  titulo: React.RefObject<HTMLHeadingElement | null>;
  firstName: string;
  d: DadosDoInicio;
}

export function EtapaDeDados({ titulo, firstName, d }: Propriedades) {
  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
      <TituloDoMolde
        ref={titulo}
        overline="Vamos começar"
        title="Quem vai casar, e quando?"
        text={`${firstName ? `Boas-vindas, ${firstName}. ` : ""}É só isso para abrir o site de vocês: nomes, data e o modelo. Local e fotos ficam para depois, em Editar o site.`}
      />
      <form onSubmit={d.submit} noValidate className="flex flex-col gap-5">
        <Campo id="onb-yourName" label="Seu nome" icon={User} error={d.errors.yourName}>
          {(c) => <input {...c} id="onb-yourName" autoComplete="given-name" maxLength={60} value={d.yourName} onChange={d.editarSeuNome} />}
        </Campo>
        <Campo id="onb-partnerName" label="Nome de quem vai casar com você" icon={Heart} error={d.errors.partnerName}>
          {(c) => <input {...c} id="onb-partnerName" autoComplete="off" maxLength={60} value={d.partnerName} onChange={d.editarNomeDoParceiro} />}
        </Campo>
        <Campo id="onb-weddingDate" label="Data do casamento" icon={CalendarHeart} optional error={d.errors.weddingDate} hint="Se ainda não têm a data, deixem em branco.">
          {(c) => <input {...c} id="onb-weddingDate" type="date" value={d.weddingDate} onChange={d.editarData} />}
        </Campo>
        <p className="rounded-[12px] border border-linha bg-papel px-4 py-3 text-[15px] text-tinta-suave">
          No site vai aparecer <strong className="font-display text-lg font-medium text-tinta">{d.coupleNames}</strong>
        </p>

        <EscolhaDoModelo escolhido={d.template} aoEscolher={d.escolherModelo} coupleNames={d.coupleNames} weddingDate={d.weddingDate} />

        {d.formError ? <AvisoDoFormulario id="onb-erro">{d.formError}</AvisoDoFormulario> : null}

        <BotaoComCarregamento type="submit" loading={d.isPending} className={cn(estiloDoBotao.primary, estiloDoBotao.block, "min-h-12")}>
          Criar o site de vocês
          <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
        </BotaoComCarregamento>
      </form>
    </section>
  );
}
