import { CheckCircle2, Hourglass, Megaphone } from "lucide-react";
import { Panel } from "@/components/plataforma/panel";
import { EmptyState } from "@/components/plataforma/empty-state";
import { StatusChip } from "@/components/plataforma/status-chip";
import { ResponsiveTable } from "@/components/plataforma/responsive-table";
import { ROTULO_DO_CANAL, rotuloDoPublico, taxaDeEntrega } from "@/lib/platform/announcement";
import { formatarDataEHora, formatarInteiro } from "@/lib/platform/format";
import type { LinhaDoHistorico } from "@/lib/platform/queries/comunicados";
import { ResumeButton } from "./resume-button";

/** Histórico: números reais. "Lidos" só existe para o aviso no painel; nos outros canais ainda não medimos. */
export function History({ rows }: { rows: LinhaDoHistorico[] }) {
  return (
    <Panel title="Histórico" padded={false}>
      {rows.length === 0 ? (
        <EmptyState icon={Megaphone} compact title="Nenhum comunicado enviado ainda">
          Quando você enviar o primeiro, ele aparece aqui com quantas pessoas receberam.
        </EmptyState>
      ) : (
        <div className="px-4 pb-4 md:px-6 md:pb-6">
          <ResponsiveTable
            caption="Comunicados enviados, do mais recente para o mais antigo"
            rows={rows}
            rowKey={(r) => r.id}
            columns={[
              { key: "t", header: "Comunicado", primary: true, cell: (r) => r.title },
              { key: "a", header: "Para quem", mobileLabel: "Para quem", cell: (r) => rotuloDoPublico(r.audience) },
              { key: "c", header: "Canais", mobileLabel: "Canais", cell: (r) => r.channels.map((c) => ROTULO_DO_CANAL[c]).join(", ") },
              { key: "d", header: "Enviado", mobileLabel: "Enviado", cell: (r) => formatarDataEHora(r.sentAt ?? r.createdAt) },
              {
                key: "e",
                header: "Entregues",
                mobileLabel: "Entregues",
                align: "right",
                cell: (r) => {
                  if (r.status === "SENDING")
                    return (
                      <span className="flex flex-col items-end gap-1">
                        <StatusChip tone="aviso" icon={Hourglass}>
                          Enviando
                        </StatusChip>
                        <ResumeButton id={r.id} />
                      </span>
                    );
                  const rate = taxaDeEntrega({ sent: r.sent, failed: r.failed });
                  return (
                    <span className="flex flex-col items-end text-sm leading-5">
                      <span className="inline-flex items-center gap-1 font-semibold text-tinta">
                        {rate === null ? "Sem envios" : <><CheckCircle2 className="size-4 text-sucesso" aria-hidden="true" />{rate}%</>}
                      </span>
                      <span className="text-tinta-suave">
                        {formatarInteiro(r.sent)} de {formatarInteiro(r.sent + r.failed)}
                        {r.failed > 0 ? `, ${formatarInteiro(r.failed)} falharam` : ""}
                        {r.skipped > 0 ? `, ${formatarInteiro(r.skipped)} pulados` : ""}
                      </span>
                    </span>
                  );
                },
              },
              {
                key: "l",
                header: "Lidos",
                mobileLabel: "Lidos",
                align: "right",
                cell: (r) =>
                  r.panelRead ? (
                    <span className="flex flex-col items-end text-sm leading-5">
                      <span className="font-semibold text-tinta">{Math.round((r.panelRead.read / r.panelRead.sent) * 100)}%</span>
                      <span className="text-tinta-suave">só no painel</span>
                    </span>
                  ) : (
                    <span className="text-sm text-tinta-suave">Ainda não medimos</span>
                  ),
              },
            ]}
          />
        </div>
      )}
    </Panel>
  );
}
