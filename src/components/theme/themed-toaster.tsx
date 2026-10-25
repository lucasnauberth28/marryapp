"use client";

import type { CSSProperties } from "react";
import { Toaster } from "sonner";
import { useTema } from "./theme-provider";

// As cores do sonner (richColors) vêm de variáveis: apontadas para os tokens Aceito, trocam com o tema.
const CORES_DOS_AVISOS = {
  "--normal-bg": "var(--color-papel)",
  "--normal-text": "var(--color-tinta)",
  "--normal-border": "var(--color-linha)",
  "--success-bg": "var(--color-sucesso-suave)",
  "--success-text": "var(--color-sucesso)",
  "--success-border": "var(--color-sucesso)",
  "--error-bg": "var(--color-perigo-suave)",
  "--error-text": "var(--color-perigo)",
  "--error-border": "var(--color-perigo)",
  "--warning-bg": "var(--color-aviso-suave)",
  "--warning-text": "var(--color-aviso)",
  "--warning-border": "var(--color-aviso)",
  "--info-bg": "var(--color-ameixa-suave)",
  "--info-text": "var(--color-ameixa)",
  "--info-border": "var(--color-ameixa)",
} as CSSProperties;

/** Avisos (sonner) no tema da página, com as cores dos tokens. */
export function AvisosComTema() {
  const { resolvedTheme } = useTema();
  return (
    <Toaster
      theme={resolvedTheme}
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      style={CORES_DOS_AVISOS}
      toastOptions={{
        style: {
          borderRadius: "16px",
          padding: "16px",
          fontSize: "14px",
          boxShadow: "var(--shadow-aceito-2)",
        },
      }}
    />
  );
}
