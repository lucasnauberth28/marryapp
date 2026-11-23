// Mensagens de serviço do Aceito pelo WhatsApp (aviso de presente, lembretes de plano). Convites aos convidados NÃO saem daqui:
// o casal envia pelo WhatsApp dele (actions/mensagens/fila.ts).
import "server-only";
import { enviarMensagemDeTextoBruta } from "./envio";
import { rastreado } from "./rastreio";

export const enviarMensagemDeTexto = (options: Parameters<typeof enviarMensagemDeTextoBruta>[0]) => rastreado("send", () => enviarMensagemDeTextoBruta(options));
