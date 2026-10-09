import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/** Moldura das páginas abertas pelo link enviado ao casal (proposta, avaliação). */
export function TokenPageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex min-h-dvh flex-col bg-linho text-tinta">
      <header className="flex h-16 items-center justify-center border-b border-linha px-4">
        <Logo height={24} />
      </header>
      <main id="conteudo" className={cn("mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12", className)}>
        {children}
      </main>
      <footer className="px-4 pb-8 text-center text-[13px] text-tinta-suave">
        Aceito · do convite ao grande dia, tudo num só sim
      </footer>
    </div>
  );
}

export const TOKEN_CARD = "rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6";
export const TOKEN_OVERLINE = "text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase";
