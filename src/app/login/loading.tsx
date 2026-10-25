import { EsqueletoDoTituloDeAcesso, EsqueletoDoMoldeDeAcesso } from "@/components/account/auth-shell-skeleton";
import { SkeletonForm } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

// Espelha a tela de acesso na aba Entrar: abas, título e os campos de e-mail e senha.
export default function LoginLoading() {
  return (
    <EsqueletoDoMoldeDeAcesso label="a tela de acesso" mobilePhoto footnote>
      <Skeleton className="mb-8 h-[52px] w-full rounded-[12px]" />
      <div className="flex flex-col gap-6">
        <EsqueletoDoTituloDeAcesso lines={1} />
        <SkeletonForm fields={2} />
      </div>
    </EsqueletoDoMoldeDeAcesso>
  );
}
