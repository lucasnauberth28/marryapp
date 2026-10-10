"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, CircleAlert, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { CustomModal } from "@/components/ui/custom-modal";
import { importGuests } from "@/actions/guest-actions";
import { btn, card, errorBox, hint, overline } from "@/components/painel/styles";
import { formatPhoneBR } from "@/lib/wedding-format";
import {
  MAX_IMPORT_ROWS,
  SHEET_TEMPLATE_FILENAME,
  decodeSpreadsheetBytes,
  parseGuestSheet,
  planImport,
  sheetTemplateCsv,
  type ColumnMap,
  type ExistingGuest,
  type ImportField,
  type ImportRow,
} from "@/lib/guest-import";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

const FIELD_LABEL: Record<ImportField, string> = {
  name: "Nome",
  phone: "Telefone",
  email: "E-mail",
  companions: "Acompanhantes",
  seats: "Lugares",
  category: "Grupo",
  dietary: "Restrição alimentar",
};

type Stage = "escolher" | "previa" | "importando" | "pronto";

interface Sheet {
  fileName: string;
  rows: ImportRow[];
  hasHeader: boolean;
  columns: ColumnMap;
}

interface ImportGuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Quem já está na lista: telefone igual a um deles é pulado. */
  existing: ExistingGuest[];
}

export function downloadSheetTemplate() {
  const blob = new Blob([sheetTemplateCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = SHEET_TEMPLATE_FILENAME;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function ImportGuestsModal({ isOpen, onClose, existing }: ImportGuestsModalProps) {
  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Importar lista de convidados"
      description="Tragam uma planilha que vocês já têm. Antes de adicionar, mostramos o que vai entrar."
      size="lg"
      className="max-h-[92vh] overflow-y-auto"
    >
      {/* Remonta ao reabrir: começa sempre do zero */}
      {isOpen ? <ImportFlow existing={existing} onClose={onClose} /> : null}
    </CustomModal>
  );
}

function ImportFlow({ existing, onClose }: { existing: ExistingGuest[]; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>("escolher");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; duplicates: number; invalid: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const stageHeading = useRef<HTMLHeadingElement>(null);

  const plan = useMemo(() => (sheet ? planImport(sheet.rows, existing) : null), [sheet, existing]);

  // A cada etapa nova, o foco vai para o título dela: quem usa leitor de tela ouve onde está.
  useEffect(() => {
    if (stage !== "escolher") stageHeading.current?.focus();
  }, [stage]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (/\.(xlsx|xls|ods)$/i.test(file.name)) {
      setError("Esse é um arquivo de Excel. Salve como CSV (no Excel: Arquivo, Salvar como, CSV UTF-8) e escolha o arquivo de novo.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("O arquivo é grande demais (o máximo é 2 MB). Divida a lista em partes.");
      return;
    }

    setReading(true);
    try {
      const bytes = await file.arrayBuffer();
      // Arquivo do Excel (xlsx) é um zip, mesmo com outro nome
      const head = new Uint8Array(bytes.slice(0, 2));
      if (head[0] === 0x50 && head[1] === 0x4b) {
        setError("Esse arquivo parece ser uma planilha do Excel. Salve como CSV e escolha o arquivo de novo.");
        return;
      }
      const parsed = parseGuestSheet(decodeSpreadsheetBytes(bytes));
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setSheet({ fileName: file.name, rows: parsed.rows, hasHeader: parsed.hasHeader, columns: parsed.columns });
      setStage("previa");
    } catch {
      setError("Não conseguimos ler esse arquivo. Confira se é um CSV ou um texto separado por vírgula e tente de novo.");
    } finally {
      setReading(false);
      // Permite escolher o mesmo arquivo de novo depois de corrigi-lo
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function runImport() {
    if (!plan || plan.toAdd.length === 0) return;
    setError(null);
    setStage("importando");
    const toastId = toast.loading("Importando a lista...");
    try {
      const res = await importGuests(
        plan.toAdd.map(({ line, name, phone, email, companions, category, dietary }) => ({
          line,
          name,
          phone,
          email,
          companions,
          category,
          dietary,
        })),
      );
      if (res.success) {
        // Repetidos: os que a prévia já tirou mais os que o servidor achou na hora de gravar
        setResult({ added: res.added, duplicates: plan.duplicates.length + res.duplicates, invalid: plan.invalid.length });
        setStage("pronto");
        toast.success(`${plural(res.added, "convidado adicionado", "convidados adicionados")}.`, { id: toastId });
      } else {
        setError(res.error);
        setStage("previa");
        toast.error(res.error, { id: toastId, duration: 6000 });
      }
    } catch {
      const message = "Não conseguimos falar com o servidor. Nada foi salvo. Confira a internet e tente de novo.";
      setError(message);
      setStage("previa");
      toast.error(message, { id: toastId, duration: 6000 });
    }
  }

  const headingClass = "font-display text-[22px] font-medium leading-7 text-tinta outline-none";

  // ------------------------------------------------------------------ escolher
  if (stage === "escolher") {
    return (
      <div className="flex flex-col gap-5">
        <div className={`${card} flex flex-col items-start gap-4 p-5`}>
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ameixa-suave text-ameixa">
              <FileSpreadsheet className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold leading-6 text-tinta">Escolham um arquivo CSV</h3>
              <p className={hint}>
                Pode ser .csv ou .txt, separado por vírgula, ponto e vírgula ou tab. O arquivo é lido aqui no seu aparelho e só os dados da lista são enviados.
              </p>
            </div>
          </div>

          <input
            ref={fileInput}
            id="importar-arquivo"
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => fileInput.current?.click()} disabled={reading} className={btn.primary}>
              {reading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
              {reading ? "Lendo o arquivo..." : "Escolher arquivo"}
            </button>
            <button type="button" onClick={downloadSheetTemplate} className={btn.quiet}>
              <Download className="size-4" aria-hidden="true" />
              Baixar modelo de planilha
            </button>
          </div>
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          {reading ? "Lendo o arquivo" : ""}
        </div>
        {error && (
          <p role="alert" className={errorBox}>
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <h3 className={overline}>Como preparar a planilha</h3>
          <ul className="list-disc space-y-1 pl-5 text-[15px] leading-6 text-tinta-suave">
            <li>
              Reconhecemos as colunas pelo título, em qualquer ordem: <strong className="font-semibold text-tinta">Nome</strong>, Telefone (ou WhatsApp, Celular), E-mail, Acompanhantes (ou Lugares), Grupo e Restrição alimentar.
            </li>
            <li>O cabeçalho é opcional. Sem ele, adivinhamos pelo conteúdo e mostramos o que entendemos antes de importar.</li>
            <li>Só o nome é obrigatório. Telefone com DDD, por exemplo (11) 91234-5678.</li>
            <li>“Lugares” conta o convidado: 2 lugares é o convidado mais 1 acompanhante.</li>
            <li>Quem já está na lista (mesmo telefone) é pulado, sem duplicar. Até {MAX_IMPORT_ROWS} convidados por vez.</li>
          </ul>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ importando
  if (stage === "importando") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center" role="status" aria-live="polite">
        <Loader2 className="size-8 animate-spin text-ameixa" aria-hidden="true" />
        <h3 ref={stageHeading} tabIndex={-1} className={headingClass}>
          Importando a lista...
        </h3>
        <p className={hint}>Isso leva só um instante. Não feche esta janela.</p>
      </div>
    );
  }

  // ------------------------------------------------------------------ pronto
  if (stage === "pronto" && result) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-sucesso-suave text-sucesso">
          <Check className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1" role="status" aria-live="polite">
          <h3 ref={stageHeading} tabIndex={-1} className={headingClass}>
            {result.added === 0 ? "Nenhum convidado novo" : `${plural(result.added, "convidado adicionado", "convidados adicionados")}`}
          </h3>
          <p className="text-tinta-suave">
            {[
              result.duplicates > 0 ? plural(result.duplicates, "já estava na lista e foi pulado", "já estavam na lista e foram pulados") : null,
              result.invalid > 0 ? plural(result.invalid, "linha com problema ficou de fora", "linhas com problema ficaram de fora") : null,
            ]
              .filter(Boolean)
              .join(". ") || "Todos já aparecem na lista de convidados."}
            {result.duplicates > 0 || result.invalid > 0 ? "." : ""}
          </p>
        </div>
        <button type="button" onClick={onClose} className={btn.primary}>
          Ver a lista
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------------ prévia
  if (!sheet || !plan) return null;
  const columnNames = (Object.keys(FIELD_LABEL) as ImportField[])
    .filter((f) => sheet.columns[f] !== undefined)
    .map((f) => FIELD_LABEL[f]);
  const addCount = plan.toAdd.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 ref={stageHeading} tabIndex={-1} className={headingClass}>
          Confira antes de importar
        </h3>
        <p className={hint}>
          Arquivo: <span className="font-semibold text-tinta">{sheet.fileName}</span>. Colunas que entendemos: {columnNames.join(", ")}.
          {!sheet.hasHeader && " Sua planilha não tinha cabeçalho: adivinhamos as colunas pelo conteúdo. Se algo estiver errado, ajuste o arquivo e escolha de novo."}
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-linha bg-sucesso-suave px-4 py-3">
          <dt className="text-sm font-semibold text-sucesso">Serão adicionados</dt>
          <dd className="font-display text-[28px] leading-8 text-tinta tabular-nums">{addCount}</dd>
        </div>
        <div className="rounded-xl border border-linha bg-areia px-4 py-3">
          <dt className="text-sm font-semibold text-tinta-suave">Já estão na lista</dt>
          <dd className="font-display text-[28px] leading-8 text-tinta tabular-nums">{plan.duplicates.length}</dd>
        </div>
        <div className={`rounded-xl border border-linha px-4 py-3 ${plan.invalid.length > 0 ? "bg-aviso-suave" : "bg-areia"}`}>
          <dt className={`text-sm font-semibold ${plan.invalid.length > 0 ? "text-aviso" : "text-tinta-suave"}`}>Com problema</dt>
          <dd className="font-display text-[28px] leading-8 text-tinta tabular-nums">{plan.invalid.length}</dd>
        </div>
      </dl>

      {plan.invalid.length > 0 && (
        <section aria-labelledby="importar-problemas" className="flex flex-col gap-2">
          <h4 id="importar-problemas" className="flex items-center gap-2 text-sm font-semibold text-aviso">
            <AlertTriangle className="size-4" aria-hidden="true" />
            Estas linhas ficam de fora até serem corrigidas
          </h4>
          <div className="max-h-52 overflow-y-auto rounded-xl border border-linha" tabIndex={0} aria-label="Linhas com problema">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-papel">
                <tr className="border-b border-linha">
                  <th scope="col" className={`${overline} px-3 py-2`}>Linha</th>
                  <th scope="col" className={`${overline} px-3 py-2`}>Nome</th>
                  <th scope="col" className={`${overline} px-3 py-2`}>O que houve</th>
                </tr>
              </thead>
              <tbody>
                {plan.invalid.map((r) => (
                  <tr key={r.line} className="border-b border-linha last:border-b-0">
                    <td className="px-3 py-2 tabular-nums text-tinta-suave">{r.line}</td>
                    <td className="px-3 py-2 text-tinta">{r.name || "(sem nome)"}</td>
                    <td className="px-3 py-2 text-aviso">{r.problem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {plan.duplicates.length > 0 && (
        <details className="rounded-xl border border-linha px-4 py-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-tinta">
            Ver quem já está na lista ({plan.duplicates.length})
          </summary>
          <ul className="mt-1 max-h-44 space-y-1 overflow-y-auto text-sm text-tinta-suave">
            {plan.duplicates.map(({ row, reason }) => (
              <li key={row.line}>
                {row.name}
                {row.phone ? `, ${formatPhoneBR(row.phone)}` : ""}
                {reason === "in_file" ? " (aparece mais de uma vez na planilha)" : ""}
              </li>
            ))}
          </ul>
        </details>
      )}

      {addCount > 0 && (
        <details className="rounded-xl border border-linha px-4 py-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-tinta">
            Ver quem será adicionado ({addCount})
          </summary>
          <ul className="mt-1 max-h-44 space-y-1 overflow-y-auto text-sm text-tinta-suave">
            {plan.toAdd.slice(0, 100).map((r) => (
              <li key={r.line}>
                <span className="font-semibold text-tinta">{r.name}</span>
                {r.phone ? `, ${formatPhoneBR(r.phone)}` : ", sem telefone"}
                {r.companions > 0 ? `, ${plural(r.companions, "acompanhante", "acompanhantes")}` : ""}
                {r.category ? `, ${r.category}` : ""}
              </li>
            ))}
            {addCount > 100 && <li>e mais {addCount - 100}...</li>}
          </ul>
        </details>
      )}

      {addCount === 0 && (
        <p className="rounded-xl bg-areia px-4 py-3 text-sm text-tinta-suave">
          Não há nenhum convidado novo para adicionar. Corrija o arquivo ou escolha outro.
        </p>
      )}

      {error && (
        <p role="alert" className={errorBox}>
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => {
            setSheet(null);
            setError(null);
            setStage("escolher");
          }}
          className={btn.secondary}
        >
          Escolher outro arquivo
        </button>
        <button type="button" onClick={() => void runImport()} disabled={addCount === 0} className={btn.primary}>
          Importar {plural(addCount, "convidado", "convidados")}
        </button>
      </div>
    </div>
  );
}
