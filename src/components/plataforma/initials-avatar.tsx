import { iniciaisDe } from "@/lib/platform/format";
import { cn } from "@/lib/utils";

/** Círculo com as iniciais ("Ana Ribeiro e Rafael Duarte" -> "AR"), como nas listas de casais e fornecedores. */
export function AvatarComIniciais({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-areia text-sm font-semibold text-tinta-suave", className)}>
      {iniciaisDe(name)}
    </span>
  );
}
