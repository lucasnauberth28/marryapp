import Link from "next/link";
import { CheckCircle2, Eye, Globe, Lock } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { Aviso } from "@/components/plataforma/notices";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { EtiquetaDeSituacao, type TomDaSituacao } from "@/components/plataforma/status-chip";
import { estiloDoBotao } from "@/components/landing/styles";
import { Interruptor } from "@/components/ui/switch";
import { formatarData, formatarDataEHora } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { obterAtividadeDoCasal, obterDominioDoCasal, obterLinhaDoTempoDoCasal, obterMadrinhaDoCasal, obterNumerosDeConvidadosDoCasal } from "@/lib/platform/queries/casais";
import { cn } from "@/lib/utils";
import { LinhaDoTempo } from "./aba-visao-geral";
import { LinhasDoDetalhe } from "./linhas-do-detalhe";

const SITUACAO_DO_DOMINIO: Record<string, { label: string; tone: TomDaSituacao }> = {
  REQUESTED: { label: "Pedido recebido", tone: "aviso" },
  REGISTERING: { label: "Em registro", tone: "aviso" },
  REGISTERED: { label: "Registrado, falta conectar", tone: "aviso" },
  CONNECTED: { label: "No ar", tone: "sucesso" },
  REJECTED: { label: "Recusado", tone: "perigo" },
  CANCELED: { label: "Cancelado", tone: "neutro" },
};
const LINHA_DE_LISTA = "flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0";

export async function AbaConvidados({ id }: { id: string }) {
  const n = await obterNumerosDeConvidadosDoCasal(id);
  const pct = (v: number) => (n.total ? `${(v / n.total) * 100}%` : "0%");
  return (
    <Painel title="Só números e saúde">
      <Aviso tone="neutro" icon={Lock} className="mb-5">
        Nomes, telefones e restrições dos convidados ficam escondidos. A privacidade deles é do casal.
      </Aviso>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-lg font-semibold">{pluralizar(n.total, "convidado", "convidados")}</p>
        {n.total > 0 && (
          <p className="text-sm text-tinta-suave">
            {n.confirmed} vão · {n.declined} não vão · {n.pending} sem resposta
          </p>
        )}
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-areia" role="img" aria-label={`${n.confirmed} confirmaram, ${n.declined} recusaram, ${n.pending} sem resposta`}>
        <span className="bg-sucesso" style={{ width: pct(n.confirmed) }} />
        <span className="bg-perigo" style={{ width: pct(n.declined) }} />
      </div>
      <div className="mt-5">
        <LinhasDoDetalhe
          items={[
            { label: "Convites enviados", value: n.total === 0 ? "Nenhum convidado ainda" : `${n.invited} de ${n.total}` },
            { label: "Sem telefone cadastrado", value: pluralizar(n.noPhone, "convidado", "convidados") },
            { label: "Presentes", value: n.giftsCount === 0 ? "Nenhum presente recebido" : `${formatarReais(n.giftsCents)} em ${pluralizar(n.giftsCount, "presente", "presentes")}` },
            { label: "Taxas pagas", value: formatarReais(n.feesCents) },
          ]}
        />
      </div>
    </Painel>
  );
}

function AvisosEnviados({ notifications }: { notifications: Awaited<ReturnType<typeof obterAtividadeDoCasal>>["notifications"] }) {
  return (
    <Painel title="Avisos enviados ao casal">
      {notifications.length === 0 ? (
        <p className="text-tinta-suave">Nenhum aviso foi enviado a este casal ainda.</p>
      ) : (
        <ul className="flex flex-col">
          {notifications.map((n) => (
            <li key={n.id} className={LINHA_DE_LISTA}>
              <span className="min-w-0">
                <span className="block leading-6 text-tinta">{n.title}</span>
                <span className="block text-sm text-tinta-suave">{formatarDataEHora(n.createdAt)}</span>
              </span>
              {n.readAt ? <EtiquetaDeSituacao tone="sucesso" icon={CheckCircle2}>Lida</EtiquetaDeSituacao> : <EtiquetaDeSituacao tone="neutro" icon={Eye}>Não lida</EtiquetaDeSituacao>}
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}

export async function AbaAtividade({ id }: { id: string }) {
  const [timeline, activity] = await Promise.all([obterLinhaDoTempoDoCasal(id, 20), obterAtividadeDoCasal(id)]);
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Painel title="O que aconteceu" action={{ label: "Abrir no registro", href: "/atividades" }}>
        <LinhaDoTempo items={timeline} />
      </Painel>
      <AvisosEnviados notifications={activity.notifications} />
    </div>
  );
}

export async function AbaDominio({ id }: { id: string }) {
  const orders = await obterDominioDoCasal(id);
  return (
    <Painel title="Domínio próprio">
      {orders.length === 0 ? (
        <EstadoVazio
          icon={Globe}
          compact
          title="Sem domínio próprio"
          action={
            <Link href="/admin/dominios" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
              Ver a fila de domínios
            </Link>
          }
        >
          O casal ainda não pediu um endereço .com.br. O plano VIP inclui um por 1 ano.
        </EstadoVazio>
      ) : (
        <ul className="flex flex-col">
          {orders.map((o) => {
            const s = SITUACAO_DO_DOMINIO[o.status] ?? { label: o.status, tone: "neutro" as const };
            return (
              <li key={o.id} className={LINHA_DE_LISTA}>
                <span>
                  <span className="block font-semibold">{o.domain}</span>
                  <span className="block text-sm text-tinta-suave">
                    Pedido em {formatarData(o.requestedAt)}
                    {o.expiresAt ? ` · vence em ${formatarData(o.expiresAt)}` : ""}
                  </span>
                </span>
                <EtiquetaDeSituacao tone={s.tone}>{s.label}</EtiquetaDeSituacao>
              </li>
            );
          })}
        </ul>
      )}
    </Painel>
  );
}

function ajusteGuardado(override: Awaited<ReturnType<typeof obterMadrinhaDoCasal>>) {
  if (!override || (override.extraMessages <= 0 && !override.blockedAt)) return "";
  const extras = override.extraMessages > 0 ? `${override.extraMessages} mensagens a mais` : "";
  const bloqueado = override.blockedAt ? `${override.extraMessages > 0 ? ", " : ""}bloqueado` : "";
  return ` Já existe um ajuste guardado para este casal: ${extras}${bloqueado}.`;
}

export async function AbaMadrinha({ id }: { id: string }) {
  const override = await obterMadrinhaDoCasal(id);
  return (
    <Painel title="Assistente">
      <div className="flex items-center justify-between gap-4 border-b border-linha pb-4">
        <div>
          <p className="font-semibold">Liz para este casal</p>
          <p className="text-sm text-tinta-suave">Ainda não ativada na plataforma</p>
        </div>
        <Interruptor checked={false} disabled aria-label="Liz para este casal (ainda não ativada na plataforma)" />
      </div>
      <p className="mt-4 text-sm leading-6 text-tinta-suave">
        Quando a Liz for ativada, aqui você vê o limite deste casal e pode bloquear por abuso.
        {ajusteGuardado(override)}
      </p>
      <Link href="/admin/madrinha" className={cn(estiloDoBotao.secondary, estiloDoBotao.sm, "mt-4")}>
        Ver a gestão da Liz
      </Link>
    </Painel>
  );
}
