import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { IndicadorDeCarregamento } from "@/components/ui/spinner";
import { Painel } from "@/components/plataforma/panel";
import { excluirRascunhoDoComunicado } from "@/actions/admin-comunicados-actions";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";
import type { ItemDeRascunho } from "./tipos";

function ExcluirRascunho({ id, current }: { id: string; current: boolean }) {
  const router = useRouter();
  const { pending, run } = useAcaoDoAdmin();
  const excluir = () =>
    run(
      () => excluirRascunhoDoComunicado({ id }),
      () => {
        if (current) router.replace("/admin/comunicados");
        router.refresh();
      },
    );
  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending || undefined}
      aria-label="Excluir este rascunho"
      onClick={excluir}
      className="grid size-11 shrink-0 place-items-center rounded-xl text-tinta-suave hover:bg-areia hover:text-perigo focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa"
    >
      {pending ? <IndicadorDeCarregamento /> : <Trash2 className="size-4" aria-hidden="true" />}
    </button>
  );
}

export function ListaDeRascunhos({ drafts, draftId }: { drafts: ItemDeRascunho[]; draftId: string | undefined }) {
  if (drafts.length === 0) return null;
  return (
    <Painel title="Rascunhos">
      <ul className="divide-y divide-linha">
        {drafts.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
            <Link href={`/admin/comunicados?rascunho=${d.id}`} className="min-w-0 text-[15px] font-semibold leading-5 text-tinta underline-offset-2 hover:underline">
              {d.title}
              <span className="block text-sm font-normal text-tinta-suave">{d.updatedAtLabel}</span>
            </Link>
            <ExcluirRascunho id={d.id} current={draftId === d.id} />
          </li>
        ))}
      </ul>
    </Painel>
  );
}
