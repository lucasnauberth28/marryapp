"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { updateSettings } from "@/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/admin/page-header";
import { toast } from "sonner";

interface SettingsClientProps {
  initialSettings: { rsvpDeadline: Date | string | null };
  /** Resumo do casamento (os dados são editados no editor do site). */
  summary: { names: string; date: string | null; place: string | null; address: string | null };
  canSeePlan: boolean;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm font-semibold leading-5 text-tinta-suave">{label}</dt>
      <dd className="min-w-0 break-words text-base leading-6 text-tinta">{children}</dd>
    </div>
  );
}

export function SettingsClient({ initialSettings, summary, canSeePlan }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [rsvpDeadline, setRsvpDeadline] = useState(
    initialSettings.rsvpDeadline ? new Date(initialSettings.rsvpDeadline).toISOString().split("T")[0] : ""
  );

  function handleSave() {
    const toastId = toast.loading("Salvando o prazo…");
    startTransition(async () => {
      const res = await updateSettings({ rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null });
      if (res.success) {
        toast.success("Prazo de confirmação salvo.", { id: toastId });
      } else {
        toast.error("Não foi possível salvar. Tente de novo.", { id: toastId });
      }
    });
  }

  return (
    <div className="flex max-w-[880px] flex-col gap-6">
      <PageHeader eyebrow="Conta" title="Configurações" />

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>O casamento</CardTitle>
          <CardDescription>Nomes, data, local, cor do tema e fotos ficam no editor do site, com prévia ao vivo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Fact label="Nomes no site">{summary.names}</Fact>
            <Fact label="Data">{summary.date ?? "Ainda sem data"}</Fact>
            <Fact label="Local">{summary.place ?? "A definir"}</Fact>
            <Fact label="Endereço do site">{summary.address ?? "Disponível depois de concluir o cadastro"}</Fact>
          </dl>
          <div>
            <Button asChild variant="outline">
              <Link href="/site-builder">Editar no editor do site</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>Confirmação de presença</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field
            htmlFor="rsvpDeadline"
            label="Prazo para responder"
            hint="Depois desta data, o formulário de confirmação é fechado automaticamente."
            className="sm:max-w-[320px]"
          >
            <DatePicker id="rsvpDeadline" value={rsvpDeadline} onChange={(e) => setRsvpDeadline(e.target.value)} />
          </Field>
          <div>
            <Button onClick={handleSave} disabled={isPending} aria-busy={isPending}>
              {isPending ? "Salvando…" : "Salvar prazo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>WhatsApp</CardTitle>
          <CardDescription>Conexão do número que envia convites e lembretes aos convidados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/configuracoes/whatsapp">Gerenciar conexão</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>Quem pode editar</CardTitle>
          <CardDescription>Convite para a outra pessoa do casal, senha, avisos e exclusão da conta ficam em Minha conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/conta">Abrir Minha conta</Link>
          </Button>
        </CardContent>
      </Card>

      {canSeePlan && (
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Plano</CardTitle>
            <CardDescription>Veja o plano do casamento, o que está incluído e os pagamentos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/plano">Ver plano e pagamentos</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
