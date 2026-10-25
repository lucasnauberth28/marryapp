import Link from "next/link";
import { estiloDoCartao, estiloDoNumeroGrande, estiloDoSobretitulo } from "@/components/casal/ui";
import { formatarReaisEnxuto } from "@/lib/formatacao/dinheiro";
import { pluralizar } from "@/lib/formatacao/plural";
import type { ResumoDosPresentes } from "./tipos";

/** Resumo: só o que o sistema sabe de verdade (pagamentos dos presentes). */
export function ResumoDosPresentesNaTela({ summary, pagos, cadastrados }: { summary: ResumoDosPresentes; pagos: number; cadastrados: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
      <article className={`${estiloDoCartao} flex flex-col gap-2 p-5 sm:p-6`}>
        <p className={estiloDoSobretitulo}>Total recebido</p>
        <span className={estiloDoNumeroGrande}>{formatarReaisEnxuto(summary.receivedCents)}</span>
        <span className="text-sm text-tinta-suave">
          {summary.receivedCount === 0
            ? "Os presentes pagos aparecem aqui."
            : `${pluralizar(summary.receivedCount, "presente", "presentes")} de ${pluralizar(summary.receivedPeople, "pessoa", "pessoas")}`}
        </span>
      </article>
      <article className={`${estiloDoCartao} flex flex-col gap-2 p-5 sm:p-6 ${summary.toCheckCount > 0 ? "border-2 border-aviso/50" : ""}`}>
        <p className={estiloDoSobretitulo}>A conferir</p>
        <span className={estiloDoNumeroGrande}>{formatarReaisEnxuto(summary.toCheckCents)}</span>
        <span className="text-sm text-tinta-suave">
          {summary.toCheckCount === 0 ? (
            "Nenhum Pix esperando conferência."
          ) : (
            <>
              {summary.toCheckCount} Pix esperando conferência.{" "}
              <Link href="/financas" className="inline-flex min-h-11 items-center font-semibold text-ameixa underline-offset-4 hover:underline sm:min-h-0">
                Conferir em Finanças
              </Link>
            </>
          )}
        </span>
      </article>
      <article className={`${estiloDoCartao} flex flex-col gap-2 p-5 sm:p-6`}>
        <p className={estiloDoSobretitulo}>Presentes pagos</p>
        <span className={estiloDoNumeroGrande}>{pagos}</span>
        <span className="text-sm text-tinta-suave">{cadastrados === 0 ? "Cadastrem o primeiro presente." : `de ${pluralizar(cadastrados, "presente cadastrado", "presentes cadastrados")}`}</span>
      </article>
    </div>
  );
}
