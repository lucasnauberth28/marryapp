import { Gift, LayoutTemplate, Upload, UserPlus } from "lucide-react";
import { RsvpStatus } from "@prisma/client";
import { rotuloCurtoDoDia, ultimasLinhasDePresentes, type ItemDaFila } from "@/lib/dashboard-summary";
import { Atalhos, type Atalho } from "../blocos/atalhos";
import { BlocoDeConfirmacoes } from "../blocos/confirmacoes";
import { BlocoDeConvites } from "../blocos/convite/bloco-de-convites";
import { BlocoDeDinheiro } from "../blocos/dinheiro/bloco-de-dinheiro";
import { BlocoDaFila } from "../blocos/fila";
import { BlocoDoOrcamento } from "../blocos/orcamento";
import { ConfirmacoesVazias, FilaDoPrimeiroAcesso } from "../blocos/primeiro-acesso";
import { BlocoDeRespostas } from "../blocos/respostas";
import type { DadosDoResumo } from "./carregar-dados";
import type { ContasDoResumo } from "./contas";
import type { ConviteDoResumo } from "./convite";
import type { IdentidadeDoCasamento, Permissao } from "./tipos";

interface PropriedadesDaGrade {
  dados: DadosDoResumo;
  contas: ContasDoResumo;
  convite: ConviteDoResumo;
  fila: ItemDaFila[];
  identity: IdentidadeDoCasamento;
  can: Permissao;
}

function atalhosDoResumo(can: Permissao): Atalho[] {
  return [
    can("/convidados") && { href: "/convidados", label: "Adicionar convidado", icon: UserPlus },
    can("/convidados") && { href: "/convidados", label: "Importar lista", icon: Upload },
    can("/presentes-admin") && { href: "/presentes-admin", label: "Criar presente", icon: Gift },
    can("/site-builder") && { href: "/site-builder", label: "Editar o site", icon: LayoutTemplate },
  ].filter((s): s is Atalho => Boolean(s));
}

function BlocoDoConvite({ dados, contas, convite, identity, can }: Omit<PropriedadesDaGrade, "fila">) {
  return (
    <BlocoDeConvites
      displayUrl={convite.siteUrl.replace(/^https?:\/\//, "")}
      siteUrl={convite.siteUrl}
      generalWhatsappUrl={convite.generalWhatsappUrl}
      generalMessage={convite.generalMessage}
      coupleNames={identity.coupleNames}
      initials={identity.initials}
      dateShort={convite.dateShort}
      coverUrl={dados.site?.heroImageUrl || dados.site?.couplePhotoUrl || null}
      invitesTotal={contas.counts.invites.total}
      sentCount={contas.counts.sent}
      canSendEach={can("/convidados")}
      toInvite={convite.toInvite}
      reminders={convite.reminders}
      firstAccess={contas.firstAccess}
    />
  );
}

function dicaDoPrazo(contas: ContasDoResumo) {
  const { deadline, deadlineKey, todayKey } = contas;
  if (!deadlineKey) return null;
  if (deadline.state === "passed") return "Prazo vencido";
  const ano = deadlineKey.slice(0, 4);
  return `Prazo em ${rotuloCurtoDoDia(deadlineKey)}${ano !== todayKey.slice(0, 4) ? ` ${ano}` : ""}`;
}

function LinhasDeResposta({ dados, can, contas }: Pick<PropriedadesDaGrade, "dados" | "can" | "contas">) {
  const rows = dados.recent.map((g) => {
    const yes = g.rsvpStatus === RsvpStatus.CONFIRMED;
    return { id: g.id, name: g.name, yes, people: yes ? 1 + g.confirmedCompanions : 1 + g.allowedCompanions, at: g.updatedAt };
  });
  return contas.counts.invites.total > 0 ? <BlocoDeRespostas rows={rows} canOpenList={can("/convidados")} className="min-[1200px]:col-span-5" /> : null;
}

/** A grade do Resumo: convite, fila, confirmações, respostas, dinheiro e orçamento, na ordem que muda com o primeiro acesso. */
export function GradeDoResumo(p: PropriedadesDaGrade) {
  const { dados, contas, convite, fila, can } = p;
  const semConvites = contas.counts.invites.total === 0;
  const orcamento = <BlocoDoOrcamento budget={contas.budget} canOpen={can("/financas")} className="min-[1200px]:col-span-5" />;
  return (
    <div className="grid items-start gap-4 min-[1200px]:grid-cols-12">
      <BlocoDoConvite {...p} />
      {contas.firstAccess ? (
        <FilaDoPrimeiroAcesso canAddGuests={can("/convidados")} className="min-[1200px]:col-span-5" />
      ) : (
        <BlocoDaFila items={fila} deadline={convite.reminding && convite.deadlineChip ? { chip: convite.deadlineChip, remindHref: "#convite" } : null} className="min-[1200px]:col-span-5" />
      )}
      {semConvites ? (
        <ConfirmacoesVazias className="min-[1200px]:col-span-7" />
      ) : (
        <BlocoDeConfirmacoes counts={contas.counts} deadlineHint={dicaDoPrazo(contas)} deadlineChip={convite.reminding ? convite.deadlineChip : null} canOpenList={can("/convidados")} className="min-[1200px]:col-span-7" />
      )}
      <LinhasDeResposta dados={dados} can={can} contas={contas} />
      {semConvites && orcamento}
      <BlocoDeDinheiro
        statement={contas.statement}
        lines={ultimasLinhasDePresentes(contas.txs, contas.giftPlan, 6)}
        plan={contas.giftPlan}
        giftCount={dados.giftCount}
        canOpenGifts={can("/presentes-admin")}
        canReceive={can("/configuracoes")}
        canConfer={can("/financas")}
        className={semConvites ? "min-[1200px]:col-span-12" : "min-[1200px]:col-span-7"}
      />
      {!semConvites && orcamento}
      <Atalhos items={atalhosDoResumo(can)} />
    </div>
  );
}

