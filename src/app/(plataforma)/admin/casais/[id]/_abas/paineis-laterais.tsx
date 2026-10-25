import Link from "next/link";
import { CheckCircle2, Clock, Mail, Receipt } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { Aviso } from "@/components/plataforma/notices";
import { estiloDoBotao } from "@/components/landing/styles";
import { formatarData, haQuantoTempo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { CabecalhoDoCasal } from "@/lib/platform/queries/casais";
import { cn } from "@/lib/utils";
import { AcoesDeCuidado } from "../_components/care-actions";
import { BotaoDeConfirmarPix } from "../_components/confirm-pix-button";
import { LinhasDoDetalhe } from "./linhas-do-detalhe";

function PainelDoPlano({ header }: { header: CabecalhoDoCasal }) {
  const { plan, gifts, pix, wedding } = header;
  const textoDoPlano = plan
    ? plan.amount > 0
      ? `Pago em ${plan.paidAt ? formatarData(plan.paidAt) : "data não registrada"} · ${formatarReais(plan.amount)} · sem mensalidade`
      : "Liberado como cortesia · sem cobrança"
    : "Gratuito";
  return (
    <Painel title="Plano">
      <p className="font-display text-[32px] leading-10 text-tinta">{plan?.planName.replace(/^Plano /, "") ?? "Básico"}</p>
      <p className="mt-1 text-sm leading-5 text-tinta-suave">
        {textoDoPlano}
        {` · taxas de presentes até agora ${formatarReais(gifts.feeCents)}`}
      </p>
      {pix && (
        <div className="mt-4 flex flex-col gap-3">
          <Aviso tone="aviso" icon={Clock}>
            <strong>Pix do {pix.planName.replace(/^Plano /, "")} a conferir.</strong> {formatarReais(pix.amount)}, gerado {haQuantoTempo(pix.createdAt)}.
          </Aviso>
          <div>
            <BotaoDeConfirmarPix subscriptionId={pix.id} />
          </div>
        </div>
      )}
      <div className="mt-4">
        <Link href={`/admin/casais/${wedding.id}?aba=pagamentos#conceder`} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
          Conceder um plano
        </Link>
      </div>
    </Painel>
  );
}

function PainelDeSaude({ header }: { header: CabecalhoDoCasal }) {
  const { wedding, guests } = header;
  const items: { ok: boolean; title: string; detail: string }[] = [
    wedding.suspendedAt
      ? { ok: false, title: "Site fora do ar", detail: `suspenso em ${formatarData(wedding.suspendedAt)}` }
      : { ok: true, title: "Site no ar", detail: `desde o cadastro, em ${formatarData(wedding.createdAt)}` },
    guests.total > 0 ? { ok: true, title: "Lista de convidados", detail: `${pluralizar(guests.total, "convidado cadastrado", "convidados cadastrados")}` } : { ok: false, title: "Lista de convidados", detail: "ainda sem convidados" },
    guests.total === 0
      ? { ok: true, title: "Confirmações", detail: "nada a responder ainda" }
      : guests.pending > 0
        ? { ok: false, title: "Confirmações", detail: `${pluralizar(guests.pending, "convidado ainda sem resposta", "convidados ainda sem resposta")}` }
        : { ok: true, title: "Confirmações", detail: "todos já responderam" },
  ];
  return (
    <Painel title="Saúde do casamento">
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            {item.ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-sucesso" aria-hidden="true" /> : <Clock className="mt-0.5 size-5 shrink-0 text-aviso" aria-hidden="true" />}
            <div>
              <p className="font-semibold leading-6 text-tinta">{item.title}</p>
              <p className="text-sm leading-5 text-tinta-suave">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Painel>
  );
}

function PainelDeContato({ email }: { email: string | undefined }) {
  return (
    <Painel title="Contato">
      <LinhasDoDetalhe items={[{ label: "E-mail", value: email ?? "sem e-mail" }]} />
      {email && (
        <a href={`mailto:${email}`} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm, "mt-4 gap-2")}>
          <Mail className="size-4" aria-hidden="true" /> Enviar e-mail
        </a>
      )}
    </Painel>
  );
}

/** A coluna da direita das abas "Visão geral" e "Pagamentos e plano". */
export function ColunaLateral({ header, tab }: { header: CabecalhoDoCasal; tab: string }) {
  const { wedding, owner } = header;
  return (
    <aside className="flex flex-col gap-6">
      <PainelDoPlano header={header} />
      {tab === "visao" && <PainelDeSaude header={header} />}
      {tab === "pagamentos" && <PainelDeContato email={owner?.username} />}
      <Painel title="Ações com cuidado">
        <AcoesDeCuidado weddingId={wedding.id} coupleNames={wedding.coupleNames} suspended={Boolean(wedding.suspendedAt)} />
        <Aviso tone="neutro" icon={Receipt} className="mt-4">
          Cada uma pede confirmação e motivo. Fica no Registro de atividades com o seu nome, o horário e o motivo.
        </Aviso>
      </Painel>
    </aside>
  );
}
