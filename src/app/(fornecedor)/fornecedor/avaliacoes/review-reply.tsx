"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { responderAvaliacao } from "@/actions/vendor-review-actions";
import { estiloDoBotao } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { AreaDeTexto } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MINIMO_DE_CARACTERES = 2;
const MAXIMO_DE_CARACTERES = 1000;

/**
 * Resposta pública a uma avaliação: campo para responder (sem resposta) ou
 * a resposta publicada com o botão "Editar resposta".
 */
interface PropriedadesDaResposta {
  reviewId: string;
  coupleNames: string;
  reply: string | null;
  repliedLabel: string | null;
  placeholder: string;
}

const RespostaPublicada = ({ reply, repliedLabel, coupleNames, botao, aoEditar }: Pick<PropriedadesDaResposta, "reply" | "repliedLabel" | "coupleNames"> & { botao: React.Ref<HTMLButtonElement>; aoEditar: () => void }) => (
  <div className="flex flex-col gap-2 rounded-xl bg-areia px-4 py-3.5">
    <p className="text-[13px] font-semibold text-tinta-suave">Sua resposta{repliedLabel ? ` · ${repliedLabel}` : ""}</p>
    <p className="text-[15px] whitespace-pre-line break-words">{reply}</p>
    <button ref={botao} type="button" onClick={aoEditar} className={cn(estiloDoBotao.quiet, estiloDoBotao.sm, "min-h-11 self-start px-3 -ml-3")}>
      <Pencil aria-hidden="true" className="size-4" />
      Editar resposta
      <span className="sr-only"> para {coupleNames}</span>
    </button>
  </div>
);

/**
 * Resposta pública a uma avaliação: campo para responder (sem resposta) ou
 * a resposta publicada com o botão "Editar resposta".
 */
export function RespostaAAvaliacao({ reviewId, coupleNames, reply, repliedLabel, placeholder }: PropriedadesDaResposta) {
  const [editing, setEditing] = useState(false);
  const returnFocus = useRef(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  // Ao salvar ou cancelar a edição, o foco volta para "Editar resposta".
  useEffect(() => {
    if (!editing && returnFocus.current) {
      returnFocus.current = false;
      editButtonRef.current?.focus();
    }
  }, [editing]);

  if (reply && !editing) return <RespostaPublicada reply={reply} repliedLabel={repliedLabel} coupleNames={coupleNames} botao={editButtonRef} aoEditar={() => setEditing(true)} />;
  return (
    <FormularioDeResposta
      reviewId={reviewId}
      coupleNames={coupleNames}
      initial={reply ?? ""}
      isEdit={Boolean(reply)}
      placeholder={placeholder}
      onDone={() => {
        returnFocus.current = true;
        setEditing(false);
      }}
    />
  );
}

interface PropriedadesDoFormulario {
  reviewId: string;
  coupleNames: string;
  initial: string;
  isEdit: boolean;
  placeholder: string;
  onDone: () => void;
}

/** O texto da resposta, a validação e o envio. */
function useRespostaPublica({ reviewId, coupleNames, initial, isEdit, onDone }: Omit<PropriedadesDoFormulario, "placeholder">) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = value.trim();
    if (text.length < MINIMO_DE_CARACTERES) return setError("Escreva a resposta antes de publicar.");
    setError(null);
    startTransition(async () => {
      const res = await responderAvaliacao(reviewId, text);
      if (!res.success) return setError(res.error ?? "Não foi possível publicar a resposta.");
      toast.success(isEdit ? "Resposta atualizada no seu perfil." : `Resposta para ${coupleNames} publicada no seu perfil.`);
      onDone();
    });
  }

  const mudar = (texto: string) => {
    setValue(texto);
    if (error) setError(null);
  };
  return { value, error, isPending, enviar, mudar };
}

function FormularioDeResposta(props: PropriedadesDoFormulario) {
  const id = useId();
  const { isEdit, placeholder, onDone } = props;
  const r = useRespostaPublica(props);
  return (
    <form onSubmit={r.enviar} noValidate className="flex flex-col gap-3">
      <AreaDeTexto
        id={`${id}-resposta`}
        label="Sua resposta pública"
        rows={2}
        value={r.value}
        maxLength={MAXIMO_DE_CARACTERES}
        disabled={r.isPending}
        autoFocus={isEdit}
        onChange={(e) => r.mudar(e.target.value)}
        placeholder={placeholder}
        error={r.error ?? undefined}
        hint={`${r.value.length}/${MAXIMO_DE_CARACTERES} caracteres`}
        inputClassName="min-h-[88px]"
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {isEdit ? (
          <button type="button" onClick={onDone} disabled={r.isPending} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm, "min-h-11")}>
            Cancelar
          </button>
        ) : null}
        <Botao type="submit" size="sm" loading={r.isPending}>
          {isEdit ? "Salvar resposta" : "Publicar resposta"}
        </Botao>
      </div>
    </form>
  );
}
