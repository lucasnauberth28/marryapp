"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * Botão de envio para formulário com Server Action (`<form action={fn}>`).
 * Enquanto a action roda, vira `loading` (spinner, desabilitado, sem pular de largura) sozinho:
 *   <form action={salvar}> … <SubmitButton>Salvar</SubmitButton> </form>
 * - Aceita as mesmas props do Button (variant, size, className); `type` é sempre "submit".
 * - `loading` extra: para somar outro estado ocupado (por exemplo um envio de arquivo antes da action).
 * - O estado vem do <form> pai e só existe para `action={função}`. Formulário com `onSubmit` e estado
 *   próprio (useTransition, useState) usa <Button loading={pendente}> direto.
 */
export function SubmitButton({
  loading = false,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type" | "asChild">) {
  const { pending } = useFormStatus();
  return <Button {...props} type="submit" loading={loading || pending} />;
}
