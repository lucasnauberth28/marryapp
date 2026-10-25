import { Esqueleto } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CampoDoFormulario = "input" | "textarea";

/**
 * Formulário com campos de rótulo flutuante (48px; área de texto de 96px), com o rótulo "em repouso" dentro.
 *   <SkeletonForm fields={4} />
 *   <SkeletonForm fields={["input", "input", "textarea"]} columns={2} submit={false} />
 * - fields: número de campos de linha única, ou a lista de tipos na ordem da tela.
 * - columns: 2 divide em duas colunas a partir do tablet (a área de texto ocupa a linha inteira).
 * - submit: botão principal de 44px no fim.
 */
export function EsqueletoDeFormulario({
  fields = 4,
  columns = 1,
  submit = true,
  className,
}: {
  fields?: number | CampoDoFormulario[];
  columns?: 1 | 2;
  submit?: boolean;
  className?: string;
}) {
  const list: CampoDoFormulario[] = typeof fields === "number" ? Array.from({ length: fields }, () => "input") : fields;
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2")}>
        {list.map((kind, i) => (
          <div
            key={i}
            className={cn(
              "flex rounded-xl border border-linha bg-papel px-4",
              kind === "textarea" ? "min-h-24 items-start pt-[18px] sm:col-span-full" : "h-12 items-center",
            )}
          >
            <Esqueleto className={cn("h-3 rounded-md", i % 3 === 0 ? "w-28" : i % 3 === 1 ? "w-20" : "w-36")} />
          </div>
        ))}
      </div>
      {submit && <Esqueleto className="h-11 w-36 rounded-xl" />}
    </div>
  );
}
