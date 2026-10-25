// O estado da redação de um comunicado: campos, público (com prévia recalculada), erros, rascunho e envio.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MODELOS_DE_COMUNICADO } from "@/lib/platform/announcement-models";
import { entradaDoComunicado, validarUrlDoLink } from "@/lib/platform/announcement";
import type { Canal, Publico } from "@/lib/platform/announcement-audience";
import { preverPublicoDoComunicado, salvarRascunhoDoComunicado, enviarComunicadoAgora, enviarTesteDoComunicadoParaMim } from "@/actions/admin-comunicados-actions";
import type { PrevisaoDoPublico } from "@/lib/platform/queries/comunicados";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";
import type { ValoresIniciaisDaRedacao } from "./tipos";

function useCamposDoComunicado(initial: ValoresIniciaisDaRedacao) {
  const [draftId, setDraftId] = useState(initial.id);
  const [title, setTitle] = useState(initial.title);
  const [emailSubject, setEmailSubject] = useState(initial.emailSubject);
  const [body, setBody] = useState(initial.body);
  const [linkUrl, setLinkUrl] = useState(initial.linkUrl);
  const [audience, setAudience] = useState<Publico>(initial.audience);
  const [channels, setChannels] = useState<Canal[]>(initial.channels);
  return { draftId, setDraftId, title, setTitle, emailSubject, setEmailSubject, body, setBody, linkUrl, setLinkUrl, audience, setAudience, channels, setChannels };
}

/** A prévia do público é recalculada a cada filtro; só vale a resposta mais nova. */
function usePrevisaoDoPublico(audience: Publico, setAudience: (p: Publico) => void, initialPreview: PrevisaoDoPublico | null) {
  const [preview, setPreview] = useState<PrevisaoDoPublico | null>(initialPreview);
  const [previewing, setPreviewing] = useState(false);
  const ticket = useRef(0);

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

  return { preview, previewing, changeAudience };
}

type FormularioDoComunicado = ValoresIniciaisDaRedacao;

/** Erros por campo do formulário, achados no navegador (o servidor confere de novo e é quem manda). */
function conferirFormulario(formulario: FormularioDoComunicado) {
  const found: Record<string, string> = {};
  const parsed = entradaDoComunicado.safeParse(formulario);
  if (!parsed.success) for (const issue of parsed.error.issues) found[String(issue.path[0] ?? "form")] ??= issue.message;
  const link = validarUrlDoLink(formulario.linkUrl);
  if (!link.ok) found.linkUrl = link.error;
  return found;
}

/** Salvar rascunho, enviar de fato e enviar o teste: as três ações do formulário. */
function useEnvioDoComunicado(form: () => FormularioDoComunicado, aoSalvar: (id: string) => void, aoEnviar: () => void) {
  const router = useRouter();
  const save = useAcaoDoAdmin();
  const send = useAcaoDoAdmin();
  const test = useAcaoDoAdmin();
  const saveDraft = () =>
    save.run(
      () => salvarRascunhoDoComunicado(form()),
      (r) => {
        aoSalvar(r.id);
        router.refresh();
      },
    );
  const sendNow = () =>
    send.run(
      () => enviarComunicadoAgora(form()),
      () => {
        aoEnviar();
        router.replace("/admin/comunicados");
        router.refresh();
      },
    );
  return { save, send, test, saveDraft, sendNow, sendTest: () => test.run(() => enviarTesteDoComunicadoParaMim(form())) };
}

type AcaoDoAdmin = ReturnType<typeof useAcaoDoAdmin>;

function situacaoDasAcoes(save: AcaoDoAdmin, send: AcaoDoAdmin, test: AcaoDoAdmin, localErrors: Record<string, string>) {
  return {
    saving: save.pending,
    sending: send.pending,
    testing: test.pending,
    busy: save.pending || send.pending || test.pending,
    errors: { ...localErrors, ...save.errors, ...test.errors, ...send.errors } as Record<string, string | undefined>,
    formError: send.formError ?? test.formError ?? save.formError,
  };
}

export function useRedacao(initial: ValoresIniciaisDaRedacao, initialPreview: PrevisaoDoPublico | null) {
  const campos = useCamposDoComunicado(initial);
  const { audience, setAudience, setChannels, setTitle, setBody } = campos;
  const { preview, previewing, changeAudience } = usePrevisaoDoPublico(audience, setAudience, initialPreview);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const form = () => ({ id: campos.draftId, title: campos.title, emailSubject: campos.emailSubject, body: campos.body, linkUrl: campos.linkUrl, audience, channels: campos.channels });
  const { save, send, test, saveDraft, sendNow, sendTest } = useEnvioDoComunicado(form, campos.setDraftId, () => setConfirmOpen(false));

  function askToSend() {
    const found = conferirFormulario(form());
    setLocalErrors(found);
    if (Object.keys(found).length === 0) setConfirmOpen(true);
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
    if (id === "plano") changeAudience({ service: t.service, kind: "vendors", vendorPlans: "pro_master" });
    else setAudience({ ...audience, service: t.service });
  }

  return {
    ...campos,
    preview,
    previewing,
    changeAudience,
    toggleChannel,
    applyTemplate,
    askToSend,
    saveDraft,
    sendNow,
    sendTest,
    confirmOpen,
    setConfirmOpen,
    ...situacaoDasAcoes(save, send, test, localErrors),
    onlyChosen: Boolean(audience.weddingIds?.length),
  };
}

export type RedacaoDoComunicado = ReturnType<typeof useRedacao>;
