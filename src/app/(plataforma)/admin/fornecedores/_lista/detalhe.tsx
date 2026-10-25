import Link from "next/link";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { estiloDoBotao } from "@/components/landing/styles";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { formatarData, haQuantoTempo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { obterDetalheDoFornecedorDoAdmin } from "@/lib/platform/queries/fornecedores";
import { ROTULO_DA_CURADORIA, visaoDaCuradoria, fotosDaGaleria } from "@/lib/platform/vendor-admin";
import { cn } from "@/lib/utils";
import { PainelDeAcoesDoFornecedor } from "../_components/vendor-actions-panel";
import { ETIQUETA_DA_VISAO } from "./etiquetas";

type Detalhe = NonNullable<Awaited<ReturnType<typeof obterDetalheDoFornecedorDoAdmin>>>;

function AvisosDoFornecedor({ detail, now }: { detail: Detalhe; now: Date }) {
  return (
    <>
      {detail.curationStatus === "REJECTED" && detail.curationNotes ? <p className="mt-3 rounded-xl bg-areia p-3 text-sm text-tinta">Mensagem enviada ao fornecedor: {detail.curationNotes}</p> : null}
      {detail.suspendedAt ? <p className="mt-3 rounded-xl bg-perigo-suave p-3 text-sm text-perigo">Suspenso {haQuantoTempo(detail.suspendedAt, now)}{detail.suspendedReason ? `. Motivo: ${detail.suspendedReason}` : ""}</p> : null}
      {detail.planTier !== "FREE" && detail.planExpiresAt ? (
        <p className="mt-3 text-sm text-tinta-suave">
          Plano {detail.planTier === "PRO" ? "Pro" : "Master"} até {formatarData(detail.planExpiresAt)}.
        </p>
      ) : null}
    </>
  );
}

function FotosDoPortfolio({ detail }: { detail: Detalhe }) {
  const photos = fotosDaGaleria(detail.galleryImages, detail.coverUrl, 3);
  if (photos.length === 0) return <p className="mt-4 rounded-xl bg-areia p-3 text-sm text-tinta-suave">Nenhuma foto enviada.</p>;
  return (
    <ul className="mt-4 grid grid-cols-3 gap-2" aria-label="Fotos do portfólio">
      {photos.map((url, i) => (
        <li key={url} className="relative aspect-square overflow-hidden rounded-xl bg-areia">
          <ImagemDaPessoa src={url} alt={`Foto ${i + 1} de ${detail.companyName}`} sizes="120px" className="object-cover" />
        </li>
      ))}
    </ul>
  );
}

function LinksDoFornecedor({ detail, basePath, isApproved }: { detail: Detalhe; basePath: string; isApproved: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {isApproved && !detail.suspendedAt ? (
        <Link href={`/fornecedores/${detail.id}`} target="_blank" className={cn(estiloDoBotao.secondary, estiloDoBotao.sm)}>
          Ver a página pública
        </Link>
      ) : null}
      {basePath === "/admin/fornecedores" && detail.curationStatus === "PENDING_APPROVAL" ? (
        <Link href={`/admin/fornecedores/curadoria?id=${detail.id}`} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm)}>
          Abrir na curadoria
        </Link>
      ) : null}
    </div>
  );
}

function PainelDoDetalheDoFornecedor({ detail, now, basePath }: { detail: Detalhe; now: Date; basePath: string }) {
  const view = visaoDaCuradoria(detail);
  const chip = ETIQUETA_DA_VISAO[view];
  const days = Math.max(0, Math.floor((now.getTime() - detail.createdAt.getTime()) / 86_400_000));
  const isApproved = detail.curationStatus === "APPROVED";
  return (
    <Painel as="article">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <EtiquetaDeSituacao tone="salvia">{detail.category}</EtiquetaDeSituacao>
        <EtiquetaDeSituacao tone={chip.tone} icon={chip.icon}>
          {ROTULO_DA_CURADORIA[view]}
        </EtiquetaDeSituacao>
      </div>
      <h2 className="mt-3 font-display text-[28px] leading-8 text-tinta">{detail.companyName}</h2>
      <p className="mt-1 text-sm text-tinta-suave">
        {detail.document ? `${detail.documentType ?? "Documento"} ${detail.document}` : "Documento não informado"}
        {detail.regions.length > 0 ? ` · ${detail.regions.slice(0, 2).join(", ")}` : ""} · cadastro {days === 0 ? "hoje" : `há ${pluralizar(days, "dia", "dias")}`}
      </p>
      <AvisosDoFornecedor detail={detail} now={now} />
      <FotosDoPortfolio detail={detail} />
      <LinksDoFornecedor detail={detail} basePath={basePath} isApproved={isApproved} />
      <div className="mt-5 border-t border-linha pt-5">
        <PainelDeAcoesDoFornecedor key={detail.id} vendorId={detail.id} curation={view} suspended={Boolean(detail.suspendedAt)} featured={detail.isFeatured} canFeature={isApproved && !detail.suspendedAt} isApproved={isApproved} />
      </div>
    </Painel>
  );
}

export async function AreaDoDetalheDoFornecedor({ detailId, now, basePath }: { detailId: string | undefined; now: Date; basePath: string }) {
  const detail = detailId ? await obterDetalheDoFornecedorDoAdmin(detailId) : null;
  if (detail) return <PainelDoDetalheDoFornecedor detail={detail} now={now} basePath={basePath} />;
  return (
    <Painel>
      <p className="text-sm text-tinta-suave">Escolha um fornecedor na lista para ver o perfil e decidir.</p>
    </Painel>
  );
}
