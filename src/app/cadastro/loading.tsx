import { EsqueletoDoTituloDeAcesso, EsqueletoDoMoldeDeAcesso } from "@/components/account/auth-shell-skeleton";
import { Esqueleto } from "@/components/ui/skeleton";

// Espelha a tela de acesso na aba Criar conta: abas, barra de etapas, título e as duas opções de tipo de conta.
export default function CadastroLoading() {
  return (
    <EsqueletoDoMoldeDeAcesso label="o cadastro" mobilePhoto footnote>
      <Esqueleto className="mb-8 h-[52px] w-full rounded-[12px]" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Esqueleto key={i} className="h-1 flex-1 rounded-full" />
              ))}
            </div>
            <Esqueleto className="h-3.5 w-14 rounded-md" />
          </div>
          <Esqueleto className="h-3.5 w-52 rounded-md" />
        </div>
        <EsqueletoDoTituloDeAcesso lines={2} titleLines={2} />
        <div className="flex flex-col gap-3">
          <Esqueleto className="h-[120px] w-full rounded-[16px]" />
          <Esqueleto className="h-[120px] w-full rounded-[16px]" />
        </div>
      </div>
    </EsqueletoDoMoldeDeAcesso>
  );
}
