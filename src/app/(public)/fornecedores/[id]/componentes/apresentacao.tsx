import { Building2, Camera, Check, ExternalLink, Globe, MapPin, Sparkles, Star, Video } from "lucide-react";
import type { FornecedorPublico } from "@/actions/vitrine/consulta";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { estiloDoTituloDaSecao } from "./estilos";


function Selos({ vendor }: { vendor: FornecedorPublico }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex min-h-7 items-center rounded-[6px] bg-salvia-suave px-3 text-sm font-semibold text-salvia">{vendor.category}</span>
      {vendor.isVerified ? (
        <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-sucesso-suave pl-2 pr-3 text-sm font-semibold text-sucesso">
          <Check className="size-4" aria-hidden="true" />
          Verificado pela curadoria
        </span>
      ) : null}
      {vendor.planTier === "MASTER" ? (
        <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-ameixa-suave pl-2 pr-3 text-sm font-semibold text-ameixa">
          <Sparkles className="size-4" aria-hidden="true" />
          Destaque
        </span>
      ) : null}
    </div>
  );
}

interface PropriedadesDoTitulo {
  vendor: FornecedorPublico;
  regioes: string[];
  averageRating: string;
}

export function TituloDoFornecedor({ vendor, regioes, averageRating }: PropriedadesDoTitulo) {
  const reviews = vendor.reviews;
  return (
    <div className="flex flex-col gap-3">
      <Selos vendor={vendor} />
      <div className="flex items-center gap-4">
        {vendor.logoUrl ? (
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-linha bg-papel sm:size-16">
            <ImagemDaPessoa src={vendor.logoUrl} alt="" sizes="64px" className="object-cover" />
          </div>
        ) : null}
        <h1 className="font-display text-[34px] font-medium leading-10 tracking-[-0.015em] text-tinta sm:text-5xl sm:leading-[54px]">{vendor.companyName}</h1>
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-2 text-base text-tinta-suave">
        {regioes.length > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {regioes.join(", ")}
          </span>
        ) : null}
        {reviews.length > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <Star className="size-4 shrink-0 fill-champanhe text-champanhe" aria-hidden="true" />
            <strong className="font-semibold text-tinta">{averageRating}</strong>
            <span className="sr-only">de 5 estrelas,</span>({reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"})
          </span>
        ) : null}
        {vendor.documentNumber ? (
          <span className="tabular-nums">
            {vendor.documentType || "CNPJ"}: {vendor.documentNumber}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function SecaoSobre({ description }: { description: string | null }) {
  if (!description) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className={estiloDoTituloDaSecao}>Sobre</h2>
      <p className="max-w-[68ch] whitespace-pre-line text-[17px] leading-7 text-tinta-suave sm:text-lg">{description}</p>
    </section>
  );
}

const LINK_EXTERNO = "inline-flex min-h-11 items-center gap-2 font-semibold text-ameixa hover:underline";

function LinksExternos({ vendor }: { vendor: FornecedorPublico }) {
  if (!vendor.instagram && !vendor.website) return null;
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1">
      {vendor.instagram ? (
        <a href={`https://instagram.com/${vendor.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className={LINK_EXTERNO}>
          <Camera className="size-4" aria-hidden="true" />
          {vendor.instagram}
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      ) : null}
      {vendor.website ? (
        <a href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className={LINK_EXTERNO}>
          <Globe className="size-4" aria-hidden="true" />
          Site do fornecedor
          <ExternalLink className="size-3.5" aria-hidden="true" />
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      ) : null}
    </div>
  );
}

function ModosDeAtendimento({ vendor }: { vendor: FornecedorPublico }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {vendor.offersOnlineMeet ? (
        <div className="flex items-center gap-3 rounded-[16px] border border-linha bg-papel p-4 shadow-aceito-1">
          <Video className="size-5 shrink-0 text-sucesso" aria-hidden="true" />
          <div>
            <p className="font-semibold">Reunião por vídeo</p>
            <p className="text-sm text-tinta-suave">Para quem mora longe ou tem pouco tempo.</p>
          </div>
        </div>
      ) : null}
      {vendor.hasPhysicalSpace && vendor.address ? (
        <div className="flex items-center gap-3 rounded-[16px] border border-linha bg-papel p-4 shadow-aceito-1">
          <Building2 className="size-5 shrink-0 text-tinta-suave" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold">Atendimento no local</p>
            <p className="text-sm text-tinta-suave">{vendor.address}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SecaoComoAtende({ vendor, regioes }: { vendor: FornecedorPublico; regioes: string[] }) {
  const temAlgo = regioes.length > 0 || vendor.offersOnlineMeet || (vendor.hasPhysicalSpace && vendor.address) || vendor.instagram || vendor.website;
  if (!temAlgo) return null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className={estiloDoTituloDaSecao}>Como atende</h2>
      {regioes.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Regiões atendidas">
          {regioes.map((region) => (
            <li key={region} className="inline-flex min-h-8 items-center gap-1.5 rounded-[8px] bg-areia px-3 text-sm font-semibold text-tinta-suave">
              <MapPin className="size-4" aria-hidden="true" />
              {region}
            </li>
          ))}
        </ul>
      ) : null}
      <ModosDeAtendimento vendor={vendor} />
      <LinksExternos vendor={vendor} />
    </section>
  );
}

