import { Bell, Mail } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { paragrafosDoCorpo } from "@/lib/platform/announcement";

const TITULO_VAZIO = "Título do comunicado";

interface Textos {
  title: string;
  emailSubject: string;
  body: string;
  linkUrl: string;
}

function PreviaDoPainel({ title, body }: Pick<Textos, "title" | "body">) {
  return (
    <div>
      <p className="mb-2 text-base font-semibold text-tinta">Aviso no painel</p>
      <div className="rounded-2xl border border-aviso bg-aviso-suave p-4">
        <p className="flex items-start gap-2 font-semibold leading-5 text-tinta">
          <Bell className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {title || TITULO_VAZIO}
        </p>
        <p className="mt-1 whitespace-pre-line text-sm leading-5 text-tinta">{body || "A mensagem aparece aqui."}</p>
      </div>
    </div>
  );
}

function PreviaDoCelular({ title }: Pick<Textos, "title">) {
  return (
    <div>
      <p className="mb-2 text-base font-semibold text-tinta">Notificação no celular</p>
      <div className="flex items-center gap-3 rounded-2xl bg-areia p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ameixa font-display text-lg text-on-ameixa" aria-hidden="true">
          a
        </span>
        <p className="min-w-0 text-sm leading-5">
          <strong className="block font-semibold text-tinta">Aceito</strong>
          <span className="block truncate text-tinta">{title || TITULO_VAZIO}</span>
        </p>
      </div>
    </div>
  );
}

function PreviaDoEmail({ title, emailSubject, body, linkUrl }: Textos) {
  return (
    <div>
      <p className="mb-2 text-base font-semibold text-tinta">E-mail</p>
      <div className="rounded-2xl border border-linha bg-papel p-4">
        <p className="text-xs leading-4 text-tinta-suave">Assunto: {emailSubject.trim() || title.trim() || "(ainda sem assunto)"}</p>
        <p className="mt-2 font-display text-2xl leading-8 text-tinta">{title || TITULO_VAZIO}</p>
        <div className="mt-2 flex flex-col gap-2 text-sm leading-5 text-tinta">
          {paragrafosDoCorpo(body).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {linkUrl.trim() && /^https:\/\//i.test(linkUrl.trim()) && <span className="mt-3 inline-flex min-h-9 items-center rounded-xl bg-ameixa px-4 text-sm font-semibold text-on-ameixa">Abrir</span>}
        <Mail className="sr-only" aria-hidden="true" />
      </div>
    </div>
  );
}

export function PreviaDoComunicado(textos: Textos) {
  return (
    <Painel title="Prévia">
      <div className="flex flex-col gap-5">
        <PreviaDoPainel title={textos.title} body={textos.body} />
        <PreviaDoCelular title={textos.title} />
        <PreviaDoEmail {...textos} />
      </div>
    </Painel>
  );
}
