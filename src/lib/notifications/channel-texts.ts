// Textos de WhatsApp e e-mail de cada aviso. Puro: o link absoluto chega pronto (appUrl no servidor).

export interface TextSource {
  title: string;
  body: string;
}

/** Mensagem curta de WhatsApp: o aviso e o link para abrir direto na tela certa. */
export function whatsappText(item: TextSource, url: string): string {
  return `Oi! ${item.title}.\n${item.body}\n\nAbra no Aceito: ${url}`;
}

export interface EmailContent {
  subject: string;
  heading: string;
  paragraphs: string[];
  cta: { label: string; url: string };
  footnotes: string[];
  preheader: string;
}

/** Conteúdo do e-mail (o modelo visual é o brandedEmail, em lib/email). */
export function emailContent(item: TextSource, url: string, settingsUrl: string): EmailContent {
  return {
    subject: item.title,
    heading: item.title,
    paragraphs: [item.body],
    cta: { label: "Abrir no Aceito", url },
    footnotes: [`Para escolher quais avisos receber por e-mail, acesse ${settingsUrl}.`],
    preheader: item.body.slice(0, 100),
  };
}
