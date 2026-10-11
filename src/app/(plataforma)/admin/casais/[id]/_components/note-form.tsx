"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addWeddingNote } from "@/actions/admin-casais-actions";
import { btn } from "@/components/landing/styles";
import { Textarea } from "@/components/ui/textarea";
import { useCasalAction } from "../../_components/use-casal-action";

/** "Nova nota" interna: só a equipe vê. */
export function NoteForm({ weddingId }: { weddingId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const { pending, error, run } = useCasalAction();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => addWeddingNote({ weddingId, body }), () => {
          setBody("");
          router.refresh();
        });
      }}
    >
      <Textarea label="Nova nota" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={3} />
      {error && (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
      <div>
        <button type="submit" disabled={pending || body.trim().length < 2} className={`${btn.secondary} ${btn.sm}`}>
          {pending ? "Salvando..." : "Salvar nota"}
        </button>
      </div>
    </form>
  );
}
