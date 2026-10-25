import Link from "next/link";
import { AlertTriangle, Ban, Globe, LogIn } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { CartaoDeIndicador, GradeDeIndicadores } from "@/components/plataforma/stat-card";
import { EtiquetaDePlano, EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { Aviso } from "@/components/plataforma/notices";
import { estiloDoBotao } from "@/components/landing/styles";
import { formatarData, formatarDataEHora, formatarDataPorExtenso, formatarDiaDaSemana, formatarInteiro, formatarPercentual, haQuantoTempo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { CabecalhoDoCasal } from "@/lib/platform/queries/casais/cabecalho";
import { urlDoSiteDoCasamento } from "@/lib/casamento/wedding-links";
import { cn } from "@/lib/utils";
import { EtiquetaDeSituacaoDoCasal } from "../../_components/situation-chip";
import { BotaoDeConfirmarPix } from "../_components/confirm-pix-button";

function BotoesDoCabecalho({ header, base }: { header: CabecalhoDoCasal; base: string }) {
  const { wedding } = header;
  return (
    <>
      <Link href={`${base}/entrar-como`} className={cn(estiloDoBotao.primary, "gap-2")}>
        <LogIn className="size-4" aria-hidden="true" /> Entrar como este casal
      </Link>
      {wedding.suspendedAt ? (
        <span aria-disabled="true" className={cn(estiloDoBotao.secondary, "gap-2 opacity-50")} title="O site está fora do ar enquanto o casal estiver suspenso">
          <Globe className="size-4" aria-hidden="true" /> Abrir o site
        </span>
      ) : (
        <a href={urlDoSiteDoCasamento(wedding.slug, undefined, wedding.customDomain)} target="_blank" rel="noopener noreferrer" className={cn(estiloDoBotao.secondary, "gap-2")}>
          <Globe className="size-4" aria-hidden="true" /> Abrir o site
        </a>
      )}
    </>
  );
}

function Etiquetas({ header }: { header: CabecalhoDoCasal }) {
  const { wedding, plan, situation } = header;
  return (
    <div className="-mt-2 flex flex-wrap gap-2">
      <EtiquetaDeSituacaoDoCasal situation={situation} />
      <EtiquetaDePlano plan={plan?.planId ?? null} />
      {wedding.suspendedAt ? <EtiquetaDeSituacao tone="perigo" icon={Ban}>Site fora do ar</EtiquetaDeSituacao> : <EtiquetaDeSituacao tone="sucesso" icon={Globe}>Site no ar</EtiquetaDeSituacao>}
    </div>
  );
}

function Problemas({ header, base, daysLeft }: { header: CabecalhoDoCasal; base: string; daysLeft: number | null }) {
  const { problems, pix, wedding } = header;
  if (problems.length === 0) return null;
  return (
    <Aviso
      tone="perigo"
      icon={AlertTriangle}
      title={problems.length === 1 ? problems[0].title : `${problems.length} problemas pedem atenção`}
      aside={
        <div className="flex flex-wrap gap-2">
          {pix && <BotaoDeConfirmarPix subscriptionId={pix.id} />}
          <Link href={`${base}?aba=pagamentos`} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
            Ver pagamentos
          </Link>
        </div>
      }
    >
      <ul className="list-disc pl-4">
        {problems.map((p) => (
          <li key={p.code}>
            {p.title}
            {p.code === "suspended" && wedding.suspendedReason ? `: ${wedding.suspendedReason}` : ""}
            {p.code === "onboarding_close" && daysLeft !== null ? ` (faltam ${pluralizar(daysLeft, "dia", "dias")})` : ""}
          </li>
        ))}
      </ul>
    </Aviso>
  );
}

function Indicadores({ header, daysLeft }: { header: CabecalhoDoCasal; daysLeft: number | null }) {
  const { wedding, guests, gifts, problems } = header;
  const closeToWedding = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14;
  const faltam = daysLeft !== null && daysLeft >= 0 ? `faltam ${pluralizar(daysLeft, "dia", "dias")}` : `foi há ${pluralizar(-(daysLeft ?? 0), "dia", "dias")}`;
  return (
    <GradeDeIndicadores>
      <CartaoDeIndicador
        label="Casamento"
        value={wedding.weddingDate ? formatarData(wedding.weddingDate) : "Sem data"}
        hint={wedding.weddingDate ? `${formatarDiaDaSemana(wedding.weddingDate)} · ${faltam}` : "O casal ainda não informou"}
        highlight={closeToWedding && problems.length > 0}
      />
      <CartaoDeIndicador label="Convidados" value={formatarInteiro(guests.total)} hint={guests.total === 0 ? "Lista vazia" : `${formatarInteiro(guests.confirmed)} confirmaram (${formatarPercentual(guests.confirmed, guests.total)})`} />
      <CartaoDeIndicador label="Presentes" value={formatarReais(gifts.cents)} hint={gifts.count === 0 ? "Nenhum presente recebido" : `${pluralizar(gifts.count, "presente recebido", "presentes recebidos")}`} />
      <CartaoDeIndicador label="Última atividade" value={wedding.lastActiveAt ? haQuantoTempo(wedding.lastActiveAt) : "—"} hint={wedding.lastActiveAt ? formatarDataEHora(wedding.lastActiveAt) : "Sem registro de visita (só medimos desde agora)"} />
    </GradeDeIndicadores>
  );
}

/** O topo do casal: título e ações, etiquetas, problemas que pedem atenção e os quatro números. */
export function CabecalhoDoCasalNaTela({ header, base, daysLeft }: { header: CabecalhoDoCasal; base: string; daysLeft: number | null }) {
  const { wedding } = header;
  return (
    <>
      <CabecalhoDaPagina
        breadcrumb={[{ label: "Casais", href: "/admin/casais" }, { label: wedding.coupleNames }]}
        eyebrow="Casal"
        title={wedding.coupleNames}
        description={`${wedding.city ? `${wedding.city} · cadastrados` : "Cadastrados"} em ${formatarDataPorExtenso(wedding.createdAt).replace(/^[^,]+, /, "")}`}
        actions={<BotoesDoCabecalho header={header} base={base} />}
      />
      <Etiquetas header={header} />
      <Problemas header={header} base={base} daysLeft={daysLeft} />
      <Indicadores header={header} daysLeft={daysLeft} />
    </>
  );
}
