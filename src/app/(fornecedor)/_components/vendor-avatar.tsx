import { cn } from "@/lib/utils";
import { initialsOf } from "../_lib/vendor-panel";

/** Avatar em arco (forma-assinatura do Aceito) com o logo do fornecedor ou as iniciais. */
export function VendorAvatar({
  name,
  logoUrl,
  size = 40,
  className,
}: {
  name: string;
  logoUrl: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-[999px_999px_8px_8px] bg-salvia-suave text-xs font-semibold text-salvia",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {logoUrl ? (
        // URLs externas variadas (Supabase/Unsplash): <img> simples, sem otimização do next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
