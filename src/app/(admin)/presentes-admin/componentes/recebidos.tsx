import Link from "next/link";
import { Etiqueta, estiloDoCartao, estiloDoTituloDaColunaDoCasal, estiloDoTituloDoCartao } from "@/components/casal/ui";
import { formatarReaisEnxuto } from "@/lib/formatacao/dinheiro";
import { SITUACAO, type PagamentoDoPresente } from "./tipos";

function SemRecebidos({ temPresentes, siteGiftsHref, aoCadastrar }: { temPresentes: boolean; siteGiftsHref: string; aoCadastrar: () => void }) {
  return (
    <div className="flex flex-col items-start gap-1 px-5 pb-6 pt-2 text-[15px] text-tinta-suave sm:px-6">
      <p>Vocês ainda não receberam presentes pelo Aceito.</p>
      {!temPresentes ? (
        <>
          <p>Para receber, cadastrem o primeiro presente. Ele aparece na lista de presentes do site.</p>
          <button type="button" onClick={aoCadastrar} className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-ameixa hover:underline">
            Cadastrar presente
          </button>
        </>
      ) : (
        <>
          <p>Quando um convidado pagar, o pagamento aparece aqui com o nome de quem enviou.</p>
          <Link href={siteGiftsHref} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center font-semibold text-ameixa hover:underline">
            Ver a lista como o convidado vê
          </Link>
        </>
      )}
    </div>
  );
}

function TabelaDoComputador({ payments }: { payments: PagamentoDoPresente[] }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr className="border-b border-linha">
            {["De", "Presente", "Valor", "Situação"].map((titulo) => (
              <th key={titulo} scope="col" className={estiloDoTituloDaColunaDoCasal}>{titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const s = SITUACAO[p.situation];
            return (
              <tr key={p.id} className="border-b border-linha last:border-b-0">
                <td className="py-3.5 pl-6 pr-3">
                  <strong className="font-semibold text-tinta">{p.from}</strong>
                  <br />
                  <span className="text-sm text-tinta-suave">{p.when}</span>
                </td>
                <td className="px-3 py-3.5 text-tinta">{p.giftTitle}</td>
                <td className="px-3 py-3.5 font-semibold tabular-nums text-tinta">{formatarReaisEnxuto(p.amount)}</td>
                <td className="py-3.5 pl-3 pr-6">
                  <Etiqueta tone={s.tone} icon={s.icon}>{s.label}</Etiqueta>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ListaDoCelular({ payments }: { payments: PagamentoDoPresente[] }) {
  return (
    <ul className="divide-y divide-linha border-t border-linha md:hidden">
      {payments.map((p) => {
        const s = SITUACAO[p.situation];
        return (
          <li key={p.id} className="flex flex-col gap-2 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-tinta">{p.from}</p>
                <p className="text-sm text-tinta-suave">{p.when}</p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-tinta">{formatarReaisEnxuto(p.amount)}</span>
            </div>
            <p className="text-[15px] text-tinta">{p.giftTitle}</p>
            <Etiqueta tone={s.tone} icon={s.icon}>{s.label}</Etiqueta>
          </li>
        );
      })}
    </ul>
  );
}

interface PropriedadesDosRecebidos {
  payments: PagamentoDoPresente[];
  temPresentes: boolean;
  siteGiftsHref: string;
  aoCadastrar: () => void;
}

export function Recebidos({ payments, temPresentes, siteGiftsHref, aoCadastrar }: PropriedadesDosRecebidos) {
  return (
    <section aria-labelledby="recebidos-titulo" className={`${estiloDoCartao} overflow-hidden`}>
      <div className="px-5 pb-2 pt-5 sm:px-6">
        <h2 id="recebidos-titulo" className={estiloDoTituloDoCartao}>Recebidos</h2>
      </div>
      {payments.length === 0 ? (
        <SemRecebidos temPresentes={temPresentes} siteGiftsHref={siteGiftsHref} aoCadastrar={aoCadastrar} />
      ) : (
        <>
          <TabelaDoComputador payments={payments} />
          <ListaDoCelular payments={payments} />
        </>
      )}
    </section>
  );
}
