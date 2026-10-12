import { AuthHeadingSkeleton, AuthShellSkeleton } from "@/components/account/auth-shell-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// O convite é conferido no servidor: título, o cartão com o casal e o botão de aceitar.
export default function ConviteLoading() {
  return (
    <AuthShellSkeleton label="o convite" footnote>
      <div className="flex flex-col gap-6">
        <AuthHeadingSkeleton />
        <Skeleton className="h-20 w-full rounded-[16px]" />
        <Skeleton className="h-12 w-full rounded-[12px]" />
      </div>
    </AuthShellSkeleton>
  );
}
