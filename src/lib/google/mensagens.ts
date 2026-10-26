// Os textos das telas de acesso quando a volta do Google não termina em login. O código vem na URL (?erro=...), então só os conhecidos valem.
const MENSAGENS: Record<string, string> = {
  "google-cancelado": "Você cancelou a entrada com o Google. Se quiser, tente de novo ou use e-mail e senha.",
  "google-invalido": "Não foi possível entrar com o Google desta vez. Tente de novo ou use e-mail e senha.",
  "google-email": "O Google ainda não confirmou o e-mail dessa conta. Confirme-o na sua conta Google ou use e-mail e senha.",
  "google-limite": "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.",
  "google-administracao": "Esta conta entra só com e-mail e senha.",
  "google-outra-conta": "Este e-mail já está ligado a outra conta Google. Entre com a conta Google certa ou use e-mail e senha.",
};

export function mensagemDoErroDoGoogle(codigo: string | undefined): string | null {
  return (codigo && Object.hasOwn(MENSAGENS, codigo) ? MENSAGENS[codigo] : null) ?? null;
}
