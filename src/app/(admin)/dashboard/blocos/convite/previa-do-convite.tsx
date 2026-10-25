import { Link2 } from "lucide-react";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { classeDaDica, classeDoRotulo } from "../../ui";

interface PropriedadesDaPrevia {
  coverUrl: string | null;
  coupleNames: string;
  initials: string;
  dateShort: string | null;
}

/** Prévia do convite: foto de capa do site com os nomes e a data (sem foto, só o fundo e o texto). */
function PreviaDoConviteCompacta({ coverUrl, coupleNames, initials, dateShort }: PropriedadesDaPrevia) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-[#4A2140]">
      {coverUrl && <ImagemDaPessoa src={coverUrl} alt={`Foto de capa do site de ${coupleNames}`} sizes="104px" className="object-cover object-[50%_30%]" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" aria-hidden="true" />
      {/* Sem foto de capa, o monograma ocupa a prévia também no celular */}
      {!coverUrl && <span className="absolute inset-0 grid place-items-center font-display text-xl font-semibold text-[#FFFFFF] md:hidden" aria-hidden="true">{initials}</span>}
      <p className="absolute inset-x-2 bottom-2.5 hidden text-center text-[11px] leading-[1.3] text-[#FFFFFF] md:block">
        <b className="block whitespace-nowrap font-display text-[13px] font-semibold tracking-[0.01em]">{coupleNames}</b>
        {dateShort}
      </p>
    </div>
  );
}

interface PropriedadesDoEndereco extends PropriedadesDaPrevia {
  displayUrl: string;
  firstAccess: boolean;
  campo: React.RefObject<HTMLInputElement | null>;
}

/** A prévia ao lado do endereço do convite (que se copia selecionando o campo). */
export function PreviaEEndereco({ displayUrl, firstAccess, campo, ...previa }: PropriedadesDoEndereco) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3.5 md:grid-cols-[104px_minmax(0,1fr)] md:gap-5">
      <PreviaDoConviteCompacta {...previa} />
      <div className="grid min-w-0 gap-3.5">
        {firstAccess && <p className="text-[14.5px] leading-[1.45] text-tinta">O site de vocês já está no ar, com os nomes e a data. Cada convidado responde pelo próprio WhatsApp, sem criar conta.</p>}
        <div className="grid gap-1.5">
          <label htmlFor="url-convite" className={classeDoRotulo}>
            Endereço do convite
          </label>
          <div className="flex min-h-11 min-w-0 items-center gap-2 rounded-[8px] border border-linha-forte bg-areia/40 pl-3.5 pr-1.5 focus-within:border-ameixa focus-within:ring-1 focus-within:ring-ameixa">
            <Link2 className="size-4 shrink-0 text-sucesso" aria-hidden="true" />
            <input ref={campo} id="url-convite" readOnly value={displayUrl} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 truncate border-0 bg-transparent p-0 font-mono text-[13.5px] text-tinta outline-none" />
          </div>
        </div>
        {!firstAccess && <p className={`${classeDaDica} hidden md:block`}>Cada convidado abre o link e responde pelo próprio WhatsApp, sem criar conta.</p>}
      </div>
    </div>
  );
}
