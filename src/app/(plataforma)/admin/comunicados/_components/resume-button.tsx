"use client";

import { useRouter } from "next/navigation";
import { btn } from "@/components/landing/styles";
import { resumeAnnouncement } from "@/actions/admin-comunicados-actions";
import { useAdminAction } from "../../_sistema/use-admin-action";

/** Retomar um envio que ficou "Enviando" (o servidor foi interrompido): quem já recebeu não recebe de novo. */
export function ResumeButton({ id }: { id: string }) {
  const router = useRouter();
  const { pending, run } = useAdminAction();
  return (
    <button type="button" disabled={pending} onClick={() => run(() => resumeAnnouncement({ id }), () => router.refresh())} className={`${btn.quiet} ${btn.sm}`}>
      Retomar envio
    </button>
  );
}
