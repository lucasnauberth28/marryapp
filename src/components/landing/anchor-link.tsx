"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

/**
 * Link para uma seção da landing ("/#como"). Na própria landing rola até a seção
 * (o Lenis anima quando está ativo; senão, rolagem nativa respeitando o movimento reduzido).
 * Em outras páginas navega para a landing e abre na seção.
 */
export function AnchorLink({ href, onClick, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: `/#${string}` }) {
  const pathname = usePathname();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (pathname !== "/" || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const id = href.slice(2);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    history.replaceState(null, "", `#${id}`);
    // Com o Lenis ativo, o próprio Lenis capta o clique e anima a rolagem.
    if (document.documentElement.classList.contains("lenis")) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
