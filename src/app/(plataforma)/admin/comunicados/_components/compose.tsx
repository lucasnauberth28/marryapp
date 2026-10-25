"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Link2, Mail, Megaphone, Send, Settings, Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IndicadorDeCarregamento } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { estiloDoCartao } from "@/components/casal/ui";
import { cn } from "@/lib/utils";
import {
  MODELOS_DE_COMUNICADO,
  ROTULO_DO_CANAL,
  GRUPOS_DE_PLANO_DO_CASAL,
  ROTULO_DO_GRUPO_DE_PLANO,
  GRUPOS_DE_PLANO_DO_FORNECEDOR,
  JANELAS_DE_CASAMENTO,
  MOTIVO_DO_WHATSAPP_DESLIGADO,
  ROTULO_DA_JANELA,
  entradaDoComunicado,
  paragrafosDoCorpo,
  validarUrlDoLink,
  type Publico,
  type Canal,
} from "@/lib/platform/announcement";
import { formatarInteiro } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import {
  excluirRascunhoDoComunicado,
  preverPublicoDoComunicado,
  salvarRascunhoDoComunicado,
  enviarComunicadoAgora,
  enviarTesteDoComunicadoParaMim,
} from "@/actions/admin-comunicados-actions";
import type { PrevisaoDoPublico } from "@/lib/platform/queries/comunicados";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";

export interface ValoresIniciaisDaRedacao {
  id?: string;
  title: string;
  emailSubject: string;
  body: string;
  linkUrl: string;
  audience: Publico;
  channels: Canal[];
}

export interface ItemDeRascunho {
  id: string;
  title: string;
  updatedAtLabel: string;
}

const ICONE_DO_MODELO = { manutencao: Settings, novidade: Megaphone, plano: Clock } as const;

export function RedacaoDeComunicado({ initial, initialPreview, drafts, emailConfigured }: { initial: ValoresIniciaisDaRedacao; initialPreview: PrevisaoDoPublico | null; drafts: ItemDeRascunho[]; emailConfigured: boolean }) {
  const router = useRouter();
  const [draftId, setDraftId] = useState(initial.id);
  const [title, setTitle] = useState(initial.title);
  const [emailSubject, setEmailSubject] = useState(initial.emailSubject);
  const [body, setBody] = useState(initial.body);
  const [linkUrl, setLinkUrl] = useState(initial.linkUrl);
  const [audience, setAudience] = useState<Publico>(initial.audience);
  const [channels, setChannels] = useState<Canal[]>(initial.channels);
  const [preview, setPreview] = useState<PrevisaoDoPublico | null>(initialPreview);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false); // recalculando o público depois de mudar um filtro
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const ticket = useRef(0);
  const save = useAcaoDoAdmin();
  const send = useAcaoDoAdmin();
  const test = useAcaoDoAdmin();
  const busy = save.pending || send.pending || test.pending;
  const errors = { ...localErrors, ...save.errors, ...test.errors, ...send.errors };
  const formError = send.formError ?? test.formError ?? save.formError;
  const onlyChosen = Boolean(audience.weddingIds?.length);

  const form = () => ({ id: draftId, title, emailSubject, body, linkUrl, audience, channels });

  /** Confere o formulário antes de abrir a confirmação (o servidor confere de novo e é quem manda). */
  function askToSend() {
    const found: Record<string, string> = {};
    const parsed = entradaDoComunicado.safeParse(form());
    if (!parsed.success) for (const issue of parsed.error.issues) found[String(issue.path[0] ?? "form")] ??= issue.message;
    const link = validarUrlDoLink(linkUrl);
    if (!link.ok) found.linkUrl = link.error;
    setLocalErrors(found);
    if (Object.keys(found).length === 0) setConfirmOpen(true);
  }

  async function refreshPreview(next: Publico) {
    const mine = ++ticket.current;
    setPreviewing(true);
    const result = await preverPublicoDoComunicado(next).catch(() => null);
    if (mine !== ticket.current) return; // chegou uma resposta mais nova
    if (result?.success) setPreview(result.preview);
    setPreviewing(false);
  }

  function changeAudience(patch: Partial<Publico>) {
    const next = { ...audience, ...patch };
    setAudience(next);
    void refreshPreview(next);
  }

  function toggleChannel(channel: Canal, on: boolean) {
    setChannels((list) => (on ? [...new Set([...list, channel])] : list.filter((c) => c !== channel)));
  }

  function applyTemplate(id: string) {
    const t = MODELOS_DE_COMUNICADO.find((x) => x.id === id);
    if (!t) return;
    setTitle(t.title);
    setBody(t.body);
    setChannels(t.channels);
    const next = { ...audience, service: t.service };
    setAudience(next);
    if (id === "plano") changeAudience({ service: t.service, kind: "vendors", vendorPlans: "pro_master" });
  }

  const audienceText = preview
    ? audience.kind === "couples"
      ? `${pluralizar(preview.couples.matched, "casal", "casais")} de ${formatarInteiro(preview.couples.total)}`
      : audience.kind === "vendors"
        ? `${pluralizar(preview.vendors.matched, "fornecedor", "fornecedores")} de ${formatarInteiro(preview.vendors.total)}`
        : `${pluralizar(preview.couples.matched, "casal", "casais")} e ${pluralizar(preview.vendors.matched, "fornecedor", "fornecedores")}`
    : null;

  const planOptions = audience.kind === "vendors" ? GRUPOS_DE_PLANO_DO_FORNECEDOR : GRUPOS_DE_PLANO_DO_CASAL;
  const planValue = audience.kind === "vendors" ? audience.vendorPlans : audience.couplePlans;
  const channelNames = channels.map((c) => ROTULO_DO_CANAL[c].toLowerCase()).join(", ");

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="modelos-t" className="flex flex-col gap-3">
        <h2 id="modelos-t" className="text-lg font-semibold leading-6 text-tinta">
          Modelos prontos
        </h2>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {MODELOS_DE_COMUNICADO.map((t) => {
            const Icon = ICONE_DO_MODELO[t.id as keyof typeof ICONE_DO_MODELO] ?? Megaphone;
            return (
              <li key={t.id}>
                <button type="button" onClick={() => applyTemplate(t.id)} className={cn(estiloDoCartao, "flex min-h-16 w-full items-center gap-3 p-4 text-left transition-shadow hover:shadow-[var(--shadow-aceito-2)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa")}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ameixa-suave text-ameixa">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold leading-5 text-tinta">{t.name}</span>
                    <span className="block text-sm leading-5 text-tinta-suave">{t.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Painel
          title={draftId ? "Editar rascunho" : "Novo comunicado"}
          aside={
            <EtiquetaDeSituacao tone="neutro" icon={Pencil}>
              Rascunho
            </EtiquetaDeSituacao>
          }
        >
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              askToSend();
            }}
          >
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-base font-semibold text-tinta">Para quem</legend>
              {onlyChosen && (
                <p className="rounded-xl bg-ameixa-suave px-3 py-2 text-sm leading-5 text-tinta">
                  Só para os {audience.weddingIds?.length} casais escolhidos em Casais.{" "}
                  <button type="button" className="font-semibold text-ameixa underline underline-offset-2" onClick={() => changeAudience({ weddingIds: undefined })}>
                    Tirar essa restrição
                  </button>
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <NativeSelect
                  label="Público"
                  value={audience.kind}
                  disabled={onlyChosen}
                  onChange={(e) => changeAudience({ kind: e.target.value as Publico["kind"] })}
                >
                  <option value="couples">Casais</option>
                  <option value="vendors">Fornecedores</option>
                  <option value="all">Casais e fornecedores</option>
                </NativeSelect>
                <NativeSelect
                  label="Plano"
                  alwaysFloat
                  value={planValue}
                  disabled={audience.kind === "all"}
                  hint={audience.kind === "all" ? "Vale ao escolher um público" : undefined}
                  onChange={(e) => changeAudience(audience.kind === "vendors" ? { vendorPlans: e.target.value as Publico["vendorPlans"] } : { couplePlans: e.target.value as Publico["couplePlans"] })}
                >
                  {planOptions.map((p) => (
                    <option key={p} value={p}>
                      {ROTULO_DO_GRUPO_DE_PLANO[p]}
                    </option>
                  ))}
                </NativeSelect>
                <NativeSelect
                  label="Data do casamento"
                  alwaysFloat
                  value={audience.weddingWindow}
                  disabled={audience.kind === "vendors"}
                  hint={audience.kind === "vendors" ? "Só para casais" : undefined}
                  onChange={(e) => changeAudience({ weddingWindow: e.target.value as Publico["weddingWindow"] })}
                >
                  {JANELAS_DE_CASAMENTO.map((w) => (
                    <option key={w} value={w}>
                      {ROTULO_DA_JANELA[w]}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <NativeSelect
                label="Tipo de aviso"
                alwaysFloat
                value={audience.service ? "service" : "news"}
                onChange={(e) => changeAudience({ service: e.target.value === "service" })}
                hint={audience.service ? "Aviso do serviço (manutenção, cobrança, segurança): chega mesmo para quem desligou os e-mails." : "Novidade: só chega a quem aceitou receber esse tipo de aviso."}
              >
                <option value="news">Novidade</option>
                <option value="service">Aviso do serviço</option>
              </NativeSelect>
              <p aria-busy={previewing || undefined} className={cn("flex min-h-7 flex-wrap items-center gap-2 text-sm leading-5 text-tinta-suave transition-opacity", previewing && "opacity-60")} aria-live="polite">
                {preview ? (
                  <>
                    <EtiquetaDeSituacao tone={preview.people === 0 || preview.tooMany ? "aviso" : "salvia"}>Chega a {audienceText}</EtiquetaDeSituacao>
                    <span>{preview.tooMany ? "Passa do limite de 5.000 pessoas por envio." : `${pluralizar(preview.people, "pessoa", "pessoas")} com conta.`}</span>
                  </>
                ) : (
                  <>
                    <span className="sr-only">Calculando o público...</span>
                    <Skeleton className="h-7 w-44 rounded-lg" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </>
                )}
              </p>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-base font-semibold text-tinta">Por onde avisar</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(["PANEL", "PUSH", "EMAIL"] as const).map((c) => (
                  <div key={c} className="flex min-h-11 items-start gap-3 rounded-xl py-2">
                    <Checkbox id={`canal-${c}`} checked={channels.includes(c)} onCheckedChange={(v) => toggleChannel(c, v === true)} className="mt-0.5" />
                    <div className="min-w-0">
                      <Label htmlFor={`canal-${c}`} className="text-base">
                        {ROTULO_DO_CANAL[c]}
                      </Label>
                      {c === "EMAIL" && !emailConfigured && <p className="text-sm leading-5 text-aviso">O e-mail não está configurado no servidor.</p>}
                      {c === "PUSH" && <p className="text-sm leading-5 text-tinta-suave">Só para quem ativou os avisos no celular.</p>}
                    </div>
                  </div>
                ))}
                <div className="flex min-h-11 items-start gap-3 rounded-xl py-2">
                  <Checkbox id="canal-WHATSAPP" checked={false} disabled className="mt-0.5" />
                  <div className="min-w-0">
                    <Label htmlFor="canal-WHATSAPP" className="text-base">
                      {ROTULO_DO_CANAL.WHATSAPP}
                    </Label>
                    <p className="text-sm leading-5 text-tinta-suave">{MOTIVO_DO_WHATSAPP_DESLIGADO}</p>
                  </div>
                </div>
              </div>
              {errors.channels && (
                <p role="alert" className="text-sm font-semibold text-perigo">
                  {errors.channels}
                </p>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-4">
              <legend className="mb-3 text-base font-semibold text-tinta">O que dizer</legend>
              <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} maxLength={90} />
              <Input label="Assunto do e-mail" optional value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} error={errors.emailSubject} maxLength={120} hint="Se ficar vazio, o e-mail usa o título." />
              <Textarea label="Mensagem" value={body} onChange={(e) => setBody(e.target.value)} error={errors.body} rows={5} maxLength={1000} hint="Texto simples. Uma linha em branco separa os parágrafos." />
              <Input label="Link do botão" optional icon={Link2} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} error={errors.linkUrl} inputMode="url" placeholder="https://" />
            </fieldset>

            {formError && !Object.keys(errors).length && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={busy}>
                <Send className="size-4" aria-hidden="true" /> Enviar agora
              </Button>
              <Button type="button" variant="outline" disabled={busy && !test.pending} loading={test.pending} onClick={() => test.run(() => enviarTesteDoComunicadoParaMim(form()))}>
                Enviar um teste para mim
              </Button>
              <Button
                type="button"
                variant="quiet"
                disabled={busy && !save.pending}
                loading={save.pending}
                onClick={() =>
                  save.run(
                    () => salvarRascunhoDoComunicado(form()),
                    (r) => {
                      setDraftId(r.id);
                      router.refresh();
                    },
                  )
                }
              >
                Salvar rascunho
              </Button>
            </div>
            <p className="text-sm leading-5 text-tinta-suave">O envio é imediato: não há agendamento. Quem já recebeu não recebe de novo se o envio for retomado.</p>
          </form>
        </Painel>

        <div className="flex min-w-0 flex-col gap-6">
          <Painel title="Prévia">
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-base font-semibold text-tinta">Aviso no painel</p>
                <div className="rounded-2xl border border-aviso bg-aviso-suave p-4">
                  <p className="flex items-start gap-2 font-semibold leading-5 text-tinta">
                    <Bell className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {title || "Título do comunicado"}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-5 text-tinta">{body || "A mensagem aparece aqui."}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-base font-semibold text-tinta">Notificação no celular</p>
                <div className="flex items-center gap-3 rounded-2xl bg-areia p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ameixa font-display text-lg text-on-ameixa" aria-hidden="true">
                    a
                  </span>
                  <p className="min-w-0 text-sm leading-5">
                    <strong className="block font-semibold text-tinta">Aceito</strong>
                    <span className="block truncate text-tinta">{title || "Título do comunicado"}</span>
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-base font-semibold text-tinta">E-mail</p>
                <div className="rounded-2xl border border-linha bg-papel p-4">
                  <p className="text-xs leading-4 text-tinta-suave">Assunto: {emailSubject.trim() || title.trim() || "(ainda sem assunto)"}</p>
                  <p className="mt-2 font-display text-2xl leading-8 text-tinta">{title || "Título do comunicado"}</p>
                  <div className="mt-2 flex flex-col gap-2 text-sm leading-5 text-tinta">
                    {paragrafosDoCorpo(body).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  {linkUrl.trim() && /^https:\/\//i.test(linkUrl.trim()) && (
                    <span className="mt-3 inline-flex min-h-9 items-center rounded-xl bg-ameixa px-4 text-sm font-semibold text-on-ameixa">Abrir</span>
                  )}
                  <Mail className="sr-only" aria-hidden="true" />
                </div>
              </div>
            </div>
          </Painel>

          {drafts.length > 0 && (
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
          )}
        </div>
      </div>

      <ModalDeConfirmacao
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        variant="default"
        title="Enviar o comunicado agora?"
        description={`Vai para ${preview ? pluralizar(preview.people, "pessoa", "pessoas") : "o público escolhido"} por ${channelNames || "nenhum canal"}. Não dá para desfazer nem agendar.`}
        confirmText="Enviar agora"
        isLoading={send.pending}
        onConfirm={() =>
          send.run(
            () => enviarComunicadoAgora(form()),
            () => {
              setConfirmOpen(false);
              router.replace("/admin/comunicados");
              router.refresh();
            },
          )
        }
      />
    </div>
  );
}

function ExcluirRascunho({ id, current }: { id: string; current: boolean }) {
  const router = useRouter();
  const { pending, run } = useAcaoDoAdmin();
  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending || undefined}
      aria-label="Excluir este rascunho"
      onClick={() =>
        run(
          () => excluirRascunhoDoComunicado({ id }),
          () => {
            if (current) router.replace("/admin/comunicados");
            router.refresh();
          },
        )
      }
      className="grid size-11 shrink-0 place-items-center rounded-xl text-tinta-suave hover:bg-areia hover:text-perigo focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa"
    >
      {pending ? <IndicadorDeCarregamento /> : <Trash2 className="size-4" aria-hidden="true" />}
    </button>
  );
}
