import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDeFormulario, EsqueletoDeImagem } from "@/components/skeletons";

const ESTILO_DO_CARTAO = "rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6";

function CabecalhoEsqueleto() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex h-4 items-center">
          <Esqueleto className="h-3 w-24 rounded-md" />
        </div>
        <div className="flex h-9 items-center md:h-[46px]">
          <Esqueleto className="h-7 w-64 rounded-lg md:h-9 md:w-96" />
        </div>
      </div>
      <div className="hidden gap-2 sm:flex">
        <Esqueleto className="h-11 w-36 rounded-xl" />
        <Esqueleto className="h-11 w-24 rounded-xl" />
      </div>
    </div>
  );
}

function IdentidadeEsqueleto() {
  return (
    <section className={`${ESTILO_DO_CARTAO} flex flex-col gap-6`}>
      <div className="flex flex-col gap-1">
        <div className="flex h-7 items-center">
          <Esqueleto className="h-5 w-28 rounded-md" />
        </div>
        <Esqueleto className="h-4 w-full max-w-lg rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <Esqueleto className="h-4 w-10 rounded-md" />
          <Esqueleto className="size-28 rounded-2xl" />
          <Esqueleto className="h-11 w-28 rounded-xl" />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Esqueleto className="h-4 w-10 rounded-md" />
          <EsqueletoDeImagem ratio="16/7" />
          <Esqueleto className="h-11 w-36 rounded-xl" />
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-linha pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Esqueleto className="h-10 w-56 rounded-md" />
          <Esqueleto className="h-11 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-linha bg-linho p-2">
              <EsqueletoDeImagem ratio="4/3" className="rounded-lg" />
              <div className="flex justify-between gap-1">
                <div className="flex gap-1">
                  <Esqueleto className="size-11 rounded-xl" />
                  <Esqueleto className="size-11 rounded-xl" />
                </div>
                <Esqueleto className="size-11 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContatoEsqueleto() {
  return (
    <section className={`${ESTILO_DO_CARTAO} flex flex-col gap-5`}>
      <div className="flex h-7 items-center">
        <Esqueleto className="h-5 w-40 rounded-md" />
      </div>
      <EsqueletoDeFormulario fields={["input", "input", "input", "input", "textarea"]} columns={2} submit={false} />
    </section>
  );
}

function RedesEsqueleto() {
  return (
    <section className={`${ESTILO_DO_CARTAO} flex flex-col gap-5`}>
      <div className="flex h-7 items-center">
        <Esqueleto className="h-5 w-36 rounded-md" />
      </div>
      <EsqueletoDeFormulario fields={["input", "input", "input"]} columns={2} submit={false} />
    </section>
  );
}

// Espelha o perfil: título e botões, aviso da curadoria, portfólio (logo, capa, galeria) e os dois cartões de campos.
export default function LoadingFornecedorPerfil() {
  return (
    <RegiaoDeCarregamento label="seu perfil" className="flex max-w-[980px] flex-col gap-6">
      <CabecalhoEsqueleto />
      <Esqueleto className="h-[74px] w-full rounded-2xl sm:h-[68px]" />
      <IdentidadeEsqueleto />
      <ContatoEsqueleto />
      <RedesEsqueleto />
      <Esqueleto className="h-11 w-full rounded-xl sm:hidden" />
    </RegiaoDeCarregamento>
  );
}
