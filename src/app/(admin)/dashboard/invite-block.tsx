"use client";

import { useRef, useState } from "react";
import { Check, ChevronRight, Clock, Copy, Link2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { marcarConviteComoCompartilhado } from "@/actions/invite-share-actions";
import { rotuloDeConvites } from "@/lib/dashboard-summary";
import { UserImage } from "@/components/ui/user-image";
import { Block, Chip, Meter, TextLink, btnPrimary, btnRow, btnSecondary, hintClass, labelClass } from "./ui";

/** Uma pessoa da lista de envio: o link do WhatsApp dela já vem pronto do servidor, com a mensagem pessoal. */
export interface InviteRow {
  id: string;
  name: string;
  /** "2 lugares · ainda não enviado", "2 lugares · convite enviado em 22 set"... */
  detail: string;
  whatsappUrl: string;
  /** "invite" anota o envio no convidado; "reminder" só abre o WhatsApp (lembrete não conta como convite enviado). */
  kind: "invite" | "reminder";
}

export interface InviteBlockProps {
  /** Endereço do convite para copiar e mostrar (sem "https://"). */
  displayUrl: string;
  siteUrl: string;
  /** Link do WhatsApp com a mensagem do convite em geral. */
  generalWhatsappUrl: string;
  generalMessage: string;
  coupleNames: string;
  /** Iniciais do casal ("A&R"), para a prévia sem foto. */
  initials: string;
  /** "17 · abril · 2027" ou null sem data. */
  dateShort: string | null;
  coverUrl: string | null;
  /** Convites no total e quantos já chegaram (enviados pelo painel, pelo WhatsApp do casal, ou já respondidos). */
  invitesTotal: number;
  sentCount: number;
  /** O perfil pode abrir a lista de convidados (envio um a um e lembretes). */
  canSendEach: boolean;
  /** Quem ainda não recebeu o convite (a lista aberta por "Enviar por convidado") e o total real. */
  toInvite: { rows: InviteRow[]; total: number };
  /** Prazo chegando: mostra quem não respondeu, com "Enviar lembrete". */
  reminders: { rows: InviteRow[]; total: number; peopleTotal: number } | null;
  /** "Primeiro acesso": ainda não há convidados. */
  firstAccess: boolean;
}

/** Copia o texto; sem a API do navegador, cai no campo selecionado. */
async function copyText(text: string, field: HTMLInputElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      field?.select();
      return document.execCommand("copy");
    } catch {
      return false;
    }
  }
}

export function InviteBlock(props: InviteBlockProps) {
  const { displayUrl, siteUrl, generalWhatsappUrl, generalMessage, coupleNames, initials, dateShort, coverUrl, invitesTotal, canSendEach, toInvite, reminders, firstAccess } = props;
  const fieldRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  // Envios feitos nesta visita: a lista e o número já refletem, sem esperar a página recarregar
  const [done, setDone] = useState<ReadonlySet<string>>(new Set());
  // Só os envios de convite entram na conta (lembrete não conta como convite enviado)
  const invitable = new Set([...toInvite.rows.map((r) => r.id), ...(reminders?.rows.filter((r) => r.kind === "invite").map((r) => r.id) ?? [])]);
  const sentNow = Math.min(invitesTotal, props.sentCount + [...done].filter((id) => invitable.has(id)).length);

  async function onCopy() {
    const ok = await copyText(siteUrl, fieldRef.current);
    if (!ok) {
      toast.error("Não deu para copiar. Selecione o endereço e copie à mão.");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  /** O WhatsApp abre pelo próprio link (nova aba); aqui só se anota o envio, sem segurar a abertura. */
  function onOpenWhatsapp(row: InviteRow) {
    setDone((prev) => new Set(prev).add(row.id));
    if (row.kind !== "invite") return;
    void marcarConviteComoCompartilhado({ guestId: row.id }).then((res) => {
      if (!res.success) {
        setDone((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
        toast.error(res.error);
      }
    });
  }

  const remaining = Math.max(0, invitesTotal - sentNow);

  return (
    <Block
      id="convite"
      title="Convite"
      className="min-[1200px]:col-span-7"
      aside={
        reminders && reminders.total > 0 ? (
          <Chip tone="aviso" icon={Clock}>
            Prazo chegando
          </Chip>
        ) : invitesTotal > 0 && sentNow >= invitesTotal ? (
          <Chip tone="ok" icon={Check}>
            {invitesTotal} de {rotuloDeConvites(invitesTotal)} {invitesTotal === 1 ? "enviado" : "enviados"}
          </Chip>
        ) : (
          <Chip tone="ok" icon={Check}>
            Site no ar
          </Chip>
        )
      }
    >
      <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3.5 md:grid-cols-[104px_minmax(0,1fr)] md:gap-5">
        {/* Prévia do convite: foto de capa do site com os nomes e a data (sem foto, só o fundo e o texto) */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-[#4A2140]">
          {coverUrl && <UserImage src={coverUrl} alt={`Foto de capa do site de ${coupleNames}`} sizes="104px" className="object-cover object-[50%_30%]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" aria-hidden="true" />
          {/* Sem foto de capa, o monograma ocupa a prévia também no celular */}
          {!coverUrl && <span className="absolute inset-0 grid place-items-center font-display text-xl font-semibold text-[#FFFFFF] md:hidden" aria-hidden="true">{initials}</span>}
          <p className="absolute inset-x-2 bottom-2.5 hidden text-center text-[11px] leading-[1.3] text-[#FFFFFF] md:block">
            <b className="block whitespace-nowrap font-display text-[13px] font-semibold tracking-[0.01em]">{coupleNames}</b>
            {dateShort}
          </p>
        </div>
        <div className="grid min-w-0 gap-3.5">
          {firstAccess && <p className="text-[14.5px] leading-[1.45] text-tinta">O site de vocês já está no ar, com os nomes e a data. Cada convidado responde pelo próprio WhatsApp, sem criar conta.</p>}
          <div className="grid gap-1.5">
            <label htmlFor="url-convite" className={labelClass}>
              Endereço do convite
            </label>
            <div className="flex min-h-11 min-w-0 items-center gap-2 rounded-[8px] border border-linha-forte bg-areia/40 pl-3.5 pr-1.5 focus-within:border-ameixa focus-within:ring-1 focus-within:ring-ameixa">
              <Link2 className="size-4 shrink-0 text-sucesso" aria-hidden="true" />
              <input ref={fieldRef} id="url-convite" readOnly value={displayUrl} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 truncate border-0 bg-transparent p-0 font-mono text-[13.5px] text-tinta outline-none" />
            </div>
          </div>
          {!firstAccess && <p className={`${hintClass} hidden md:block`}>Cada convidado abre o link e responde pelo próprio WhatsApp, sem criar conta.</p>}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2 max-md:[&>*]:flex-1">
          <a href={generalWhatsappUrl} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
            <MessageCircle className="size-[17px]" aria-hidden="true" />
            Enviar pelo WhatsApp
            <span className="sr-only">(abre em outra aba)</span>
          </a>
          <button type="button" onClick={onCopy} className={btnSecondary}>
            {copied ? <Check className="size-[17px] text-sucesso" aria-hidden="true" /> : <Copy className="size-[17px]" aria-hidden="true" />}
            <span>{copied ? "Link copiado" : "Copiar link"}</span>
          </button>
          {canSendEach && (
            <button
              type="button"
              onClick={() => setListOpen((v) => !v)}
              disabled={firstAccess}
              aria-expanded={listOpen}
              aria-controls="lista-envio"
              className={btnSecondary}
            >
              <Send className="size-[17px]" aria-hidden="true" />
              Enviar por convidado
            </button>
          )}
        </div>
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? "Link copiado" : ""}
        </span>
        <p className={hintClass}>
          {firstAccess
            ? "O WhatsApp de vocês abre com a mensagem pronta. Para mandar um convite pessoal para cada pessoa, adicionem os convidados primeiro."
            : "O WhatsApp de vocês abre com a mensagem pronta; vocês escolhem a pessoa ou o grupo."}
        </p>
        <details className="group">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-[8px] text-[13px] font-medium text-tinta-suave [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" aria-hidden="true" />
            Ver a mensagem
          </summary>
          <blockquote className="mb-1 whitespace-pre-line rounded-[8px] border border-linha bg-areia/40 px-3.5 py-3 text-[13.5px] leading-[1.5] text-tinta">{generalMessage}</blockquote>
        </details>
      </div>

      {/* Quantos convites já chegaram, e a lista para mandar um por um */}
      <div className="grid gap-2 border-t border-linha pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className={labelClass}>Convites enviados</span>
          {invitesTotal === 0 ? (
            <span className={hintClass}>Nenhum convidado na lista ainda</span>
          ) : (
            <span className={hintClass}>
              <b className="font-semibold tabular-nums text-tinta">{sentNow.toLocaleString("pt-BR")}</b> de {rotuloDeConvites(invitesTotal)} ·{" "}
              <b className="font-semibold tabular-nums text-tinta">{remaining.toLocaleString("pt-BR")}</b> por enviar
            </span>
          )}
        </div>
        <Meter
          label={invitesTotal === 0 ? "Nenhum convite para enviar ainda" : `${sentNow} de ${rotuloDeConvites(invitesTotal)} ${invitesTotal === 1 ? "enviado" : "enviados"}`}
          segments={[
            { value: sentNow, className: "bg-ameixa" },
            { value: remaining, className: "bg-areia" },
          ]}
        />

        {canSendEach && !firstAccess && (
          <div id="lista-envio" hidden={!listOpen}>
            {toInvite.rows.length === 0 ? (
              <p className={`${hintClass} py-2`}>Todos os convites já foram enviados.</p>
            ) : (
              <ul aria-label="Convites por enviar" className="mt-1 overflow-hidden rounded-[8px] border border-linha">
                {toInvite.rows.map((row) => (
                  <GuestLine key={row.id} row={row} sent={done.has(row.id)} onOpen={onOpenWhatsapp} />
                ))}
                <li className="flex min-h-12 items-center justify-between gap-3 border-t border-linha bg-areia/40 px-3.5">
                  <span className={hintClass}>
                    Mostrando {toInvite.rows.length} de {toInvite.total.toLocaleString("pt-BR")} {toInvite.total === 1 ? "convite por enviar" : "convites por enviar"}
                  </span>
                  <TextLink href="/convidados">Ver na lista</TextLink>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Prazo chegando: lembrar quem ainda não respondeu */}
      {reminders && reminders.total > 0 && canSendEach && (
        <div className="grid gap-2 border-t border-linha pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className={labelClass}>Lembrar quem não respondeu</h3>
            <span className={hintClass}>
              <b className="font-semibold tabular-nums text-tinta">{reminders.total.toLocaleString("pt-BR")}</b> {reminders.total === 1 ? "convite sem resposta" : "convites sem resposta"} · {reminders.peopleTotal.toLocaleString("pt-BR")} {reminders.peopleTotal === 1 ? "pessoa" : "pessoas"}
            </span>
          </div>
          <ul aria-label="Convites sem resposta" className="overflow-hidden rounded-[8px] border border-linha">
            {reminders.rows.map((row) => (
              <GuestLine key={row.id} row={row} sent={done.has(row.id)} onOpen={onOpenWhatsapp} />
            ))}
            <li className="flex min-h-12 items-center justify-between gap-3 border-t border-linha bg-areia/40 px-3.5">
              <span className={hintClass}>
                Mostrando {reminders.rows.length} de {reminders.total.toLocaleString("pt-BR")} {reminders.total === 1 ? "convite" : "convites"}
              </span>
              <TextLink href="/convidados?resposta=sem-resposta">Ver na lista</TextLink>
            </li>
          </ul>
        </div>
      )}
    </Block>
  );
}

function GuestLine({ row, sent, onOpen }: { row: InviteRow; sent: boolean; onOpen: (row: InviteRow) => void }) {
  const isReminder = row.kind === "reminder";
  return (
    <li className="flex min-h-[60px] items-center gap-3 border-t border-linha py-2 pl-3.5 pr-2 first:border-t-0">
      <div className="grid min-w-0 flex-1">
        <b className="truncate font-semibold text-tinta">{row.name}</b>
        <small className="text-[13px] text-tinta-suave">{sent ? (isReminder ? "WhatsApp aberto com o lembrete" : "enviado agora") : row.detail}</small>
      </div>
      {sent ? (
        <Chip tone="ok" icon={Check}>
          {isReminder ? "Aberto" : "Enviado"}
        </Chip>
      ) : (
        <a href={row.whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => onOpen(row)} className={btnRow}>
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
