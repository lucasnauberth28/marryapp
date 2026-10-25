import { Check, MessageCircle } from "lucide-react";
import { Etiqueta, estiloDaLinhaDeBotoes } from "../../ui";
import type { LinhaDeConvite } from "./tipos";

export function LinhaDoConvidado({ row, sent, onOpen }: { row: LinhaDeConvite; sent: boolean; onOpen: (row: LinhaDeConvite) => void }) {
  const isReminder = row.kind === "reminder";
  return (
    <li className="flex min-h-[60px] items-center gap-3 border-t border-linha py-2 pl-3.5 pr-2 first:border-t-0">
      <div className="grid min-w-0 flex-1">
        <b className="truncate font-semibold text-tinta">{row.name}</b>
        <small className="text-[13px] text-tinta-suave">{sent ? (isReminder ? "WhatsApp aberto com o lembrete" : "enviado agora") : row.detail}</small>
      </div>
      {sent ? (
        <Etiqueta tone="ok" icon={Check}>
          {isReminder ? "Aberto" : "Enviado"}
        </Etiqueta>
      ) : (
        <a href={row.whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => onOpen(row)} className={estiloDaLinhaDeBotoes}>
          <MessageCircle className="size-[17px]" aria-hidden="true" />
          {isReminder ? "Enviar lembrete" : "Enviar"}
          <span className="sr-only">
            {" "}
            para {row.name} (abre o WhatsApp em outra aba)
          </span>
        </a>
      )}
    </li>
  );
}
