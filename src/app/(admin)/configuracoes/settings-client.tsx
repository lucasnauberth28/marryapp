"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "@/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Settings, Palette, CalendarClock, MapPin } from "lucide-react";
import { toast } from "sonner";

export function SettingsClient({ initialSettings }: { initialSettings: any }) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    rsvpDeadline: initialSettings.rsvpDeadline ? new Date(initialSettings.rsvpDeadline).toISOString().split('T')[0] : "",
    weddingDate: initialSettings.weddingDate ? new Date(initialSettings.weddingDate).toISOString().split('T')[0] : "",
    weddingLocation: initialSettings.weddingLocation || "",
    weddingLocationUrl: initialSettings.weddingLocationUrl || "",
    themeColor: initialSettings.themeColor || "#18181b",
    heroImageUrl: initialSettings.heroImageUrl || "",
    welcomeText: initialSettings.welcomeText || "",
  });

  async function handleSave() {
    startTransition(async () => {
      const res = await updateSettings({
        rsvpDeadline: formData.rsvpDeadline ? new Date(formData.rsvpDeadline) : null,
        weddingDate: formData.weddingDate ? new Date(formData.weddingDate) : null,
        weddingLocation: formData.weddingLocation || null,
        weddingLocationUrl: formData.weddingLocationUrl || null,
        themeColor: formData.themeColor,
        heroImageUrl: formData.heroImageUrl || null,
        welcomeText: formData.welcomeText || null,
      });
      if (res.success) {
        toast.success("Configurações salvas com sucesso!");
      } else {
        toast.error("Erro ao salvar configurações.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Settings className="w-8 h-8 text-zinc-400" />
          Configurações
        </h2>
        <p className="text-zinc-500 mt-1">
          Personalize a página pública e defina regras do casamento.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Regras do Casamento */}
        <Card className="shadow-sm border-zinc-200/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-zinc-500" />
              Informações & Regras do Casamento
            </CardTitle>
            <CardDescription>Defina as datas e locais principais para exibição e controle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rsvpDeadline">Data Limite para RSVP (Confirmação de Presença)</Label>
                <Input
                  id="rsvpDeadline"
                  type="date"
                  value={formData.rsvpDeadline}
                  onChange={(e) => setFormData({ ...formData, rsvpDeadline: e.target.value })}
                />
                <p className="text-xs text-zinc-500">Após esta data, o formulário de RSVP será bloqueado automaticamente.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weddingDate">Data do Casamento</Label>
                <Input
                  id="weddingDate"
                  type="date"
                  value={formData.weddingDate}
                  onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                />
                <p className="text-xs text-zinc-500">Será exibida de forma elegante na tela pública principal.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="weddingLocation">Local do Casamento (Nome do Espaço)</Label>
                <Input
                  id="weddingLocation"
                  type="text"
                  placeholder="Ex: Mansão das Flores"
                  value={formData.weddingLocation}
                  onChange={(e) => setFormData({ ...formData, weddingLocation: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weddingLocationUrl">Link do Google Maps do Local</Label>
                <Input
                  id="weddingLocationUrl"
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={formData.weddingLocationUrl}
                  onChange={(e) => setFormData({ ...formData, weddingLocationUrl: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-zinc-500" />
              Personalização da Página Pública
            </CardTitle>
            <CardDescription>Altere a aparência do site que os convidados acessam.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="themeColor">Cor Principal do Tema (Hexadecimal)</Label>
              <div className="flex gap-3">
                <Input
                  id="themeColorPicker"
                  type="color"
                  className="w-16 p-1 h-10"
                  value={formData.themeColor}
                  onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                />
                <Input
                  id="themeColor"
                  type="text"
                  className="flex-1"
                  value={formData.themeColor}
                  onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroImageUrl">URL da Foto Principal (Capa)</Label>
              <Input
                id="heroImageUrl"
                type="url"
                placeholder="https://..."
                value={formData.heroImageUrl}
                onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcomeText">Texto de Boas-vindas</Label>
              <Textarea
                id="welcomeText"
                rows={4}
                value={formData.welcomeText}
                onChange={(e) => setFormData({ ...formData, welcomeText: e.target.value })}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isPending} className="bg-zinc-900 hover:bg-zinc-800 text-white w-full">
                {isPending ? "Salvando..." : "Salvar Configurações"}
                <Save className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Módulo de Integrações */}
        <Card className="shadow-sm border-zinc-200/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-zinc-500" />
              Integrações & Comunicação
            </CardTitle>
            <CardDescription>Gerencie a conexão de disparo de mensagens do seu celular.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-200 gap-4">
              <div>
                <h4 className="font-medium text-zinc-900">WhatsApp Automático</h4>
                <p className="text-sm text-zinc-500">
                  Gerencie a conexão com o número que dispara convites e lembretes para os convidados.
                </p>
              </div>
              <Button asChild variant="outline">
                <a href="/configuracoes/whatsapp">Gerenciar Conexão</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
