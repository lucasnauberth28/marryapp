// O texto final de uma mensagem para um convidado: o modelo com {nome}, o link do convite digital (se houver) e os links
// dos botões do modelo (confirmar, recusar, presentes). Puro: roda na ação que monta a fila e nos testes.

export type BotaoDoModelo = { id: string; text: string };

/** Lê os botões gravados no modelo; JSON quebrado vira "sem botões". */
export function interpretarBotoes(buttons: string | null | undefined): BotaoDoModelo[] | null {
  if (!buttons) return null;
  try {
    const lidos = JSON.parse(buttons);
    return Array.isArray(lidos) ? lidos : null;
  } catch {
    return null;
  }
}

/** Cada botão vira uma linha com o link certo: presentes leva à lista; confirmar e recusar levam à confirmação. */
export function textoComOsLinks(texto: string, botoes: BotaoDoModelo[] | null, urls: { rsvp: string; gifts: string }, linhaDoConvite: string | null = null): string {
  let mensagem = linhaDoConvite ? `${texto}\n\n${linhaDoConvite}` : texto;
  for (const btn of botoes ?? []) {
    const ehPresente = (btn.text || "").toLowerCase().includes("presente") || btn.id === "gifts";
    mensagem += `\n\n${btn.text || ""}:\n${ehPresente ? urls.gifts : urls.rsvp}`;
  }
  return mensagem;
}
