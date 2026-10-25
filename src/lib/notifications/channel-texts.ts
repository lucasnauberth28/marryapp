// Textos de WhatsApp e e-mail de cada aviso. Puro: o link absoluto chega pronto (appUrl no servidor).

export interface OrigemDoTexto {
  title: string;
  body: string;
}

/** Mensagem curta de WhatsApp: o aviso e o link para abrir direto na tela certa. */
export function textoDoWhatsapp(item: OrigemDoTexto, url: string): string {
  return `Oi! ${item.title}.\n${item.body}\n\nAbra no Aceito: ${url}`;
}

export interface ConteudoDoEmail {
  subject: string;
  heading: string;
  paragraphs: string[];
  cta: { label: string; url: string };
  footnotes: string[];
  preheader: string;
}

/** Conteúdo do e-mail (o modelo visual é o brandedEmail, em lib/email). */
export function conteudoDoEmail(item: OrigemDoTexto, url: string, settingsUrl: string): ConteudoDoEmail {
  return {
    subject: item.title,
    heading: item.title,
    paragraphs: [item.body],
    cta: { label: "Abrir no Aceito", url },
    footnotes: [`Para escolher quais avisos receber por e-mail, acesse ${settingsUrl}.`],
    preheader: item.body.slice(0, 100),
  };
}
