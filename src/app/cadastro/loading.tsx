import { AuthHeadingSkeleton, AuthShellSkeleton } from "@/components/account/auth-shell-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Espelha a tela de acesso na aba Criar conta: abas, título e as duas opções de tipo de conta.
export default function CadastroLoading() {
  return (
    <AuthShellSkeleton label="o cadastro" mobilePhoto footnote>
      <Skeleton className="mb-8 h-[52px] w-full rounded-[12px]" />
      <div className="flex flex-col gap-6">
        <AuthHeadingSkeleton />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-[16px]" />
          <Skeleton className="h-24 w-full rounded-[16px]" />
        </div>
      </div>
    </AuthShellSkeleton>
  );
}
