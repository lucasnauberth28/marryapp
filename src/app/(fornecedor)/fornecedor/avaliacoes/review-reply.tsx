"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { replyToReview } from "@/actions/vendor-review-actions";
import { btn } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

const MIN = 2;
const MAX = 1000;

/**
 * Resposta pública a uma avaliação: campo para responder (sem resposta) ou
 * a resposta publicada com o botão "Editar resposta".
 */
export function ReviewReply({
  reviewId,
  coupleNames,
  reply,
  repliedLabel,
  placeholder,
}: {
  reviewId: string;
  coupleNames: string;
  reply: string | null;
  repliedLabel: string | null;
  placeholder: string;
}) {
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

  if (reply && !editing) {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-areia px-4 py-3.5">
        <p className="text-[13px] font-semibold text-tinta-suave">
          Sua resposta{repliedLabel ? ` · ${repliedLabel}` : ""}
        </p>
        <p className="text-[15px] whitespace-pre-line break-words">{reply}</p>
        <button
          ref={editButtonRef}
          type="button"
          onClick={() => setEditing(true)}
          className={cn(btn.quiet, btn.sm, "min-h-11 self-start px-3 -ml-3")}
        >
          <Pencil aria-hidden="true" className="size-4" />
          Editar resposta
          <span className="sr-only"> para {coupleNames}</span>
        </button>
      </div>
    );
  }

  return (
    <ReplyForm
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

function ReplyForm({
  reviewId,
  coupleNames,
  initial,
  isEdit,
  placeholder,
  onDone,
}: {
  reviewId: string;
  coupleNames: string;
  initial: string;
  isEdit: boolean;
  placeholder: string;
  onDone: () => void;
}) {
  const id = useId();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fieldId = `${id}-resposta`;
  const errorId = `${id}-erro`;
  const countId = `${id}-contagem`;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = value.trim();
    if (text.length < MIN) {
      setError("Escreva a resposta antes de publicar.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await replyToReview(reviewId, text);
      if (res.success) {
        toast.success(
          isEdit ? "Resposta atualizada no seu perfil." : `Resposta para ${coupleNames} publicada no seu perfil.`,
        );
        onDone();
      } else {
        setError(res.error ?? "Não foi possível publicar a resposta.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-semibold">
          Sua resposta pública
        </label>
        <textarea
          id={fieldId}
          rows={2}
          value={value}
          maxLength={MAX}
          disabled={isPending}
          autoFocus={isEdit}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(error && errorId, countId)}
          className={cn(
            "min-h-[88px] w-full resize-y rounded-xl border bg-papel px-4 py-3 text-base text-tinta placeholder:text-tinta-suave/80",
            "disabled:opacity-60",
            error ? "border-perigo" : "border-linha-forte",
          )}
        />
        <div className="flex items-start justify-between gap-3 text-sm">
          {error ? (
            <p id={errorId} role="alert" className="font-medium text-perigo">
              {error}
            </p>
          ) : (
            <span />
          )}
          <span id={countId} className="shrink-0 tabular-nums text-tinta-suave">
            {value.length}/{MAX}
            <span className="sr-only"> caracteres</span>
          </span>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {isEdit ? (
          <button type="button" onClick={onDone} disabled={isPending} className={cn(btn.secondary, btn.sm, "min-h-11")}>
            Cancelar
          </button>
        ) : null}
        <button type="submit" disabled={isPending} className={cn(btn.primary, btn.sm, "min-h-11")}>
          {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          {isEdit ? "Salvar resposta" : "Publicar resposta"}
        </button>
      </div>
    </form>
  );
}
