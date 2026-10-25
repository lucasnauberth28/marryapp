import { CircleAlert } from "lucide-react";

export function AvisoDeSuspensao({ motivo }: { motivo: string | null }) {
  return (
    <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-perigo/40 bg-perigo-suave px-4 py-3.5 text-tinta">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-perigo" />
      <div className="text-[15px] leading-6">
        <p className="font-semibold">Seu perfil está suspenso</p>
        <p>
          Ele não aparece na lista de fornecedores e não recebe novos pedidos de orçamento.
          {motivo ? ` Motivo: ${motivo}` : ""} Para entender e resolver, fale com a equipe do Aceito.
        </p>
      </div>
    </div>
  );
}
