"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { areaDoCaminho, iconeDoMenu, areasVisiveis } from "@/components/admin/nav-config";
import { ancoraDoMenu } from "@/lib/tour/steps";

/**
 * Navegação do painel no celular: barra inferior fixa com as mesmas 5 áreas do menu do computador.
 * Configurações, plano, conta e sair ficam no menu do avatar, no cabeçalho.
 */
export function BarraDeAbasMovel({ allowedPaths }: { allowedPaths: string[] }) {
  const pathname = usePathname();
  const areas = areasVisiveis(allowedPaths);
  const current = areaDoCaminho(areas, pathname);
  if (areas.length === 0) return null;

  return (
    <nav
      aria-label="Navegação principal"
      style={{ gridTemplateColumns: `repeat(${areas.length}, minmax(0, 1fr))` }}
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-linha bg-papel/95 px-1 pb-[max(env(safe-area-inset-bottom),4px)] pt-1 backdrop-blur-md md:hidden"
    >
      {areas.map((area) => {
        const Icon = iconeDoMenu(area.icon);
        const active = current?.id === area.id;
        return (
          <Link
            key={area.id}
            href={area.href}
            data-tour={ancoraDoMenu(area.href)}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] leading-4 transition-colors ${
              active ? "font-semibold text-ameixa" : "font-medium text-tinta-suave"
            }`}
          >
            <span className={`grid h-7 w-[52px] place-items-center rounded-full transition-colors duration-200 ${active ? "bg-ameixa-suave" : "bg-transparent"}`}>
              <Icon className="size-[21px]" strokeWidth={1.6} aria-hidden="true" />
            </span>
            {area.shortName}
          </Link>
        );
      })}
    </nav>
  );
}
