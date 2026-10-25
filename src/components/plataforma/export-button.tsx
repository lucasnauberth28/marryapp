"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/button";
import { nomeDoArquivoDoCabecalho } from "@/lib/platform/download-name";

/**
 * Botão de exportação (CSV, planilha, arquivo de dados). Baixa de uma rota `/api/admin/...` protegida e mostra
 * "gerando" no próprio botão (spinner, desabilitado, sem pular de largura) até o arquivo ficar pronto.
 *   <ExportButton href="/api/admin/casais.csv?aba=problema" fallbackName="casais.csv"><Download …/> Exportar CSV</ExportButton>
 * - Sem JavaScript o botão não faz nada; a rota continua aceitando o GET direto (é a mesma de antes).
 * - Erro da rota (limite, sessão, seleção inválida) vira aviso; o nome vem do Content-Disposition.
 */
export function BotaoDeExportar({
  href,
  fallbackName,
  children,
  variant = "outline",
  ...props
}: Omit<ComponentProps<typeof Botao>, "onClick" | "loading" | "type" | "asChild"> & { href: string; fallbackName: string; children: ReactNode }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(href, { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? "Não foi possível gerar o arquivo agora. Tente de novo.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nomeDoArquivoDoCabecalho(res.headers.get("content-disposition"), fallbackName);
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      toast.error("Não foi possível gerar o arquivo agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Botao type="button" variant={variant} loading={busy} onClick={download} {...props}>
      {children}
    </Botao>
  );
}
