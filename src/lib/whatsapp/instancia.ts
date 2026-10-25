import "server-only";
import { CHAVE_DA_EVOLUTION, INSTANCIA_DA_EVOLUTION, URL_DA_EVOLUTION, cabecalhosDaEvolution, estaConfigurado } from "./config";

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Busca o status de conexão da instância do Evolution API. */
export async function obterEstadoDaConexao() {
  if (!estaConfigurado()) return { state: "DISCONNECTED", message: "Serviço não configurado." };

  try {
    const response = await fetch(`${URL_DA_EVOLUTION}/instance/connectionState/${INSTANCIA_DA_EVOLUTION}`, { headers: cabecalhosDaEvolution(), cache: "no-store" });
    if (!response.ok) return { state: "DISCONNECTED", message: "Não foi possível verificar o status." };

    const data = await response.json();
    return { state: data.instance?.state || "DISCONNECTED" };
  } catch {
    return { state: "DISCONNECTED", message: "Erro ao comunicar com Evolution API." };
  }
}

/** Cria a instância caso ela não exista no servidor da Evolution API. */
async function criarInstancia() {
  if (!estaConfigurado()) return null;
  try {
    const response = await fetch(`${URL_DA_EVOLUTION}/instance/create`, {
      method: "POST",
      headers: cabecalhosDaEvolution(true),
      body: JSON.stringify({ instanceName: INSTANCIA_DA_EVOLUTION, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
      cache: "no-store",
    });
    return await response.json();
  } catch (err) {
    console.error("[Evolution API] Erro ao criar instância:", err);
    return null;
  }
}

async function desconectarInstancia() {
  if (!estaConfigurado()) return null;
  try {
    const response = await fetch(`${URL_DA_EVOLUTION}/instance/logout/${INSTANCIA_DA_EVOLUTION}`, { method: "DELETE", headers: cabecalhosDaEvolution(), cache: "no-store" });
    return await response.json();
  } catch (err) {
    console.error("[Evolution API] Erro ao deslogar instância:", err);
    return null;
  }
}

const pedirQrCode = (url: string) => fetch(url, { method: "GET", headers: cabecalhosDaEvolution(), cache: "no-store" });

/**
 * O QR de pareamento é uma credencial: nunca enviá-lo a serviços externos para gerar imagem.
 * Devolve a data URL da Evolution, ou o código bruto (renderizado como QR no navegador).
 */
function extrairQrCode(data: { base64?: string; code?: string; qrcode?: { base64?: string; code?: string } } | null): string | null {
  return data?.base64 || data?.qrcode?.base64 || data?.qrcode?.code || data?.code || null;
}

/** Sem QR na primeira resposta: desloga a instância para forçar um QR novo e tenta mais uma vez. */
async function tentarQrCodeDepoisDeDeslogar(fetchUrl: string) {
  await desconectarInstancia();
  await esperar(2500);
  const retryRes = await pedirQrCode(fetchUrl);
  if (!retryRes.ok) return null;
  const retryData = await retryRes.json();
  const qrCode = extrairQrCode(retryData);
  return qrCode ? { success: true as const, qrCode } : { success: false as const, error: `Sem QR pós-logout: ${JSON.stringify(retryData).substring(0, 150)}` };
}

/**
 * Tenta conectar a instância e retorna o QR Code se estiver desconectado.
 * Se a instância não existir, cria-a automaticamente.
 */
export async function conectarInstancia() {
  if (!estaConfigurado()) {
    return { success: false, error: `Serviço não configurado: URL=${URL_DA_EVOLUTION}, KEY=${!!CHAVE_DA_EVOLUTION}, INSTANCE=${INSTANCIA_DA_EVOLUTION}` };
  }

  try {
    const fetchUrl = `${URL_DA_EVOLUTION}/instance/connect/${INSTANCIA_DA_EVOLUTION}`;
    let response = await pedirQrCode(fetchUrl);

    if (response.status === 404) {
      await criarInstancia();
      await esperar(2000);
      response = await pedirQrCode(fetchUrl);
    }

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `HTTP ${response.status} de ${fetchUrl}: ${errText.substring(0, 150)}` };
    }

    const data = await response.json();
    const qrCode = extrairQrCode(data);
    if (qrCode) return { success: true, qrCode };

    // Resposta OK mas sem QR Code ({ count: 0 })
    const novaTentativa = await tentarQrCodeDepoisDeDeslogar(fetchUrl);
    if (novaTentativa) return novaTentativa;

    return { success: false, error: `Sem QR Code no payload: ${JSON.stringify(data).substring(0, 150)}` };
  } catch (error) {
    return { success: false, error: `Exceção em connectInstance: ${(error instanceof Error ? error.message : undefined) || String(error)}` };
  }
}
