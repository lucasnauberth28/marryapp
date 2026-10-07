"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateSettings } from "@/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/admin/page-header";
import { Save, Settings, CalendarClock, Sliders, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface SettingsClientProps {
  initialSettings: { rsvpDeadline: Date | string | null };
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [rsvpDeadline, setRsvpDeadline] = useState(
    initialSettings.rsvpDeadline ? new Date(initialSettings.rsvpDeadline).toISOString().split("T")[0] : ""
  );

  function handleSave() {
    const toastId = toast.loading("Salvando prazo de confirmação...");
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
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Regras do casamento e integrações." />

      <div className="grid gap-6 max-w-4xl">
        <Card className="shadow-sm border-zinc-200/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-zinc-500" aria-hidden="true" />
              Confirmação de presença
            </CardTitle>
            <CardDescription>Depois desta data, o formulário de RSVP é fechado automaticamente.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2 sm:w-72">
              <Label htmlFor="rsvpDeadline">Prazo para confirmar presença</Label>
              <DatePicker id="rsvpDeadline" value={rsvpDeadline} onChange={(e) => setRsvpDeadline(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={isPending} className="gap-2 sm:mb-0.5">
              <Save className="w-4 h-4" aria-hidden="true" />
              Salvar prazo
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sliders className="w-5 h-5 text-zinc-500" aria-hidden="true" />
              Dados do casamento e aparência do site
            </CardTitle>
            <CardDescription>
              Nomes, data, local, cor do tema e fotos ficam no editor do site, com prévia ao vivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/site-builder">
                Abrir o editor do site <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-zinc-500" aria-hidden="true" />
              WhatsApp
            </CardTitle>
            <CardDescription>Conexão do número que envia convites e lembretes aos convidados.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/configuracoes/whatsapp">Gerenciar conexão</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
