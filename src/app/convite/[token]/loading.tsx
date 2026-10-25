import { EsqueletoDoTituloDeAcesso, EsqueletoDoMoldeDeAcesso } from "@/components/account/auth-shell-skeleton";
import { Esqueleto } from "@/components/ui/skeleton";

// O convite é conferido no servidor: título, o cartão com o casal e o botão de aceitar.
export default function ConviteLoading() {
  return (
    <EsqueletoDoMoldeDeAcesso label="o convite" footnote>
      <div className="flex flex-col gap-6">
        <EsqueletoDoTituloDeAcesso />
        <Esqueleto className="h-20 w-full rounded-[16px]" />
        <Esqueleto className="h-12 w-full rounded-[12px]" />
      </div>
    </EsqueletoDoMoldeDeAcesso>
  );
}
