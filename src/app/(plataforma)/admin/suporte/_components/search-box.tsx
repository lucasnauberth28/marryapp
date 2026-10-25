"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { iniciarProgressoDaNavegacao } from "@/components/feedback/navigation-progress";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";

/**
 * Campo da "Busca em tudo": manda a busca para a própria página (?q=) e o resultado vem do servidor.
 * O botão fica ocupado até a URL chegar; o resultado antigo é trocado por um esqueleto (ver suporte/page.tsx).
 */
export function CaixaDeBusca({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <form
      action="/admin/suporte#busca"
      method="get"
      role="search"
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        iniciarProgressoDaNavegacao();
        startTransition(() => router.push(q ? `/admin/suporte?q=${encodeURIComponent(q)}#busca` : "/admin/suporte#busca"));
      }}
    >
      <Entrada label="E-mail, telefone, endereço do site ou nome" name="q" defaultValue={defaultValue} icon={Search} autoComplete="off" fieldClassName="flex-1" maxLength={100} />
      <Botao type="submit" loading={pending} className="px-6 sm:min-w-28">
        Buscar
      </Botao>
    </form>
  );
}
