import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { Logotipo } from "@/components/brand/logo";
import { SeletorSegmentadoDoTema } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";
import { estiloDoBotao } from "../styles";
import { LinkDoMenu, NAVEGACAO } from "./itens";

interface Propriedades {
  dialog: React.RefObject<HTMLDivElement | null>;
  closeButton: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  aoFechar: () => void;
  aoFecharComFoco: () => void;
}

function ListaDoMenu({ open, aoFechar }: Pick<Propriedades, "open" | "aoFechar">) {
  return (
    <nav aria-label="Principal" className="px-4 pt-4">
      <ul>
        {NAVEGACAO.map((item, i) => (
          <li
            key={item.href}
            className={cn("border-b border-linha transition-[opacity,transform] duration-500 ease-[var(--ease-aceito)]", open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")}
            style={{ transitionDelay: open ? `${80 + i * 60}ms` : "0ms" }}
          >
            <LinkDoMenu item={item} onClick={aoFechar} className="group/item flex min-h-16 items-center justify-between font-display text-[28px] leading-9 text-tinta">
              {item.label}
              <ChevronRight aria-hidden="true" className="size-5 text-tinta-suave transition-transform duration-300 group-hover/item:translate-x-1" strokeWidth={1.6} />
            </LinkDoMenu>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function RodapeDoMenu({ open, aoFechar }: Pick<Propriedades, "open" | "aoFechar">) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 border-t border-linha px-4 pb-8 pt-4 transition-opacity duration-500", open ? "opacity-100" : "opacity-0")}
      style={{ transitionDelay: open ? "320ms" : "0ms" }}
    >
      <div className="mb-2 flex flex-col gap-2">
        <p className="text-sm font-semibold text-tinta">Aparência</p>
        <SeletorSegmentadoDoTema />
      </div>
      <p className="mb-2 text-sm text-tinta-suave">Foi convidado para um casamento? Use o link enviado pelo casal. Você não precisa criar uma conta.</p>
      <Link href="/cadastro?plano=basic" onClick={aoFechar} className={cn(estiloDoBotao.primary, estiloDoBotao.block)}>
        Criar conta grátis
      </Link>
      <Link href="/login" onClick={aoFechar} className={cn(estiloDoBotao.secondary, estiloDoBotao.block)}>
        Entrar
      </Link>
    </div>
  );
}

/** Menu em tela cheia (celular e tablet). Sempre montado para animar a entrada e a saída. */
export function MenuEmTelaCheia({ dialog, closeButton, open, aoFechar, aoFecharComFoco }: Propriedades) {
  return (
    <div
      ref={dialog}
      id="menu-publico"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      data-lenis-prevent
      inert={!open}
      className={cn(
        "fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-papel text-tinta transition-[opacity,visibility] duration-300 ease-[var(--ease-aceito)] lg:hidden",
        open ? "visible opacity-100" : "invisible opacity-0",
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-linha pl-4 pr-2">
        <Link href="/" aria-label="Aceito, início" onClick={aoFechar} className="-m-2 flex rounded-[12px] p-2">
          <Logotipo height={26} />
        </Link>
        <button
          ref={closeButton}
          type="button"
          onClick={aoFecharComFoco}
          aria-label="Fechar menu"
          className="grid size-11 cursor-pointer place-items-center rounded-[12px] text-tinta transition-colors duration-200 hover:bg-areia"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={1.6} />
        </button>
      </div>
      <ListaDoMenu open={open} aoFechar={aoFechar} />
      <RodapeDoMenu open={open} aoFechar={aoFechar} />
    </div>
  );
}
