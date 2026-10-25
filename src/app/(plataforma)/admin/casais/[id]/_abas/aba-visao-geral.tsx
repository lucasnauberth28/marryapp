import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarDataEHora } from "@/lib/platform/format";
import { obterLinhaDoTempoDoCasal } from "@/lib/platform/queries/casais/abas";
import type { CabecalhoDoCasal } from "@/lib/platform/queries/casais/cabecalho";
import { urlDoSiteDoCasamento } from "@/lib/wedding-links";
import { LinhaDeLink } from "../_components/copy-link";
import { LinhasDoDetalhe } from "./linhas-do-detalhe";

type LinhaDoTempoDoCasal = Awaited<ReturnType<typeof obterLinhaDoTempoDoCasal>>;

export function LinhaDoTempo({ items }: { items: LinhaDoTempoDoCasal }) {
  return (
    <ol className="flex flex-col">
      {items.map((item) => (
        <li key={item.id} className="relative flex gap-4 pb-5 last:pb-0">
          <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-ameixa/70" />
          <div className="min-w-0">
            <p className="text-sm leading-5 text-tinta-suave">{formatarDataEHora(item.at)}</p>
            <p className="flex flex-wrap items-center gap-2 leading-6 text-tinta">
              {item.text}
              {item.badge && <EtiquetaDeSituacao tone={item.badge.tone}>{item.badge.label}</EtiquetaDeSituacao>}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function DadosDoCasamento({ header }: { header: CabecalhoDoCasal }) {
  const { wedding, owner, openDomainOrder } = header;
  const emails = wedding.members.map((m) => m.username);
  return (
    <Painel title="Dados do casamento">
      <LinhasDoDetalhe
        items={[
          { label: "Casal", value: wedding.coupleNames },
          { label: emails.length > 1 ? "E-mails" : "E-mail", value: emails.length ? emails.join(", ") : "sem e-mail" },
          { label: "Cidade", value: wedding.city ?? "Não informada" },
          { label: "Domínio próprio", value: wedding.customDomain ?? (openDomainOrder ? `${openDomainOrder.domain} (pedido em andamento)` : "Nenhum") },
          { label: "Cadastro", value: formatarDataEHora(wedding.createdAt) },
          { label: "Onboarding concluído", value: wedding.onboardedAt ? formatarDataEHora(wedding.onboardedAt) : "Ainda não" },
          { label: "Última entrada com senha", value: owner?.lastLoginAt ? formatarDataEHora(owner.lastLoginAt) : "Sem registro" },
        ]}
      />
    </Painel>
  );
}

export async function AbaVisaoGeral({ header, sideColumn }: { header: CabecalhoDoCasal; sideColumn: React.ReactNode }) {
  const { wedding } = header;
  const timeline = await obterLinhaDoTempoDoCasal(wedding.id, 8);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        <DadosDoCasamento header={header} />
        <Painel title="Links do casal">
          <ul>
            <LinhaDeLink label="Site do casal" url={urlDoSiteDoCasamento(wedding.slug, undefined, wedding.customDomain)} />
            <LinhaDeLink label="Confirmação de presença" url={urlDoSiteDoCasamento(wedding.slug, "rsvp", wedding.customDomain)} />
            <LinhaDeLink label="Lista de presentes" url={urlDoSiteDoCasamento(wedding.slug, "presentes", wedding.customDomain)} />
          </ul>
        </Painel>
        <Painel title="Linha do tempo" action={{ label: "Ver tudo no registro", href: "/atividades" }}>
          <LinhaDoTempo items={timeline} />
        </Painel>
      </div>
      {sideColumn}
    </div>
  );
}
