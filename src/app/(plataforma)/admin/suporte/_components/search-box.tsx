"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { btn } from "@/components/landing/styles";

/** Campo da "Busca em tudo": formulário GET para a própria página (o resultado vem do servidor, na URL ?q=). */
export function SearchBox({ defaultValue }: { defaultValue: string }) {
  return (
    <form action="/admin/suporte#busca" method="get" role="search" className="flex flex-col gap-3 sm:flex-row">
      <Input label="E-mail, telefone, endereço do site ou nome" name="q" defaultValue={defaultValue} icon={Search} autoComplete="off" fieldClassName="flex-1" maxLength={100} />
      <button type="submit" className={`${btn.primary} sm:min-w-28`}>
        Buscar
      </button>
    </form>
  );
}
