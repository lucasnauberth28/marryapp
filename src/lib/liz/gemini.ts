// Conversa com o Gemini (API REST do Google AI). Sem SDK: um POST. Puro onde dá (montar o pedido, ler a resposta, custo).

/** Modelo padrão; a administração troca por GEMINI_MODEL sem mexer no código. */
export const MODELO_PADRAO_DO_GEMINI = "gemini-2.5-flash";

/** O modelo responde exatamente isto quando a pergunta foge do casamento e do Aceito. */
export const MARCA_DE_FORA_DO_ASSUNTO = "[FORA_DO_ASSUNTO]";

export const RESPOSTA_PARA_FORA_DO_ASSUNTO = "Eu só consigo ajudar com o casamento e com o painel do Aceito. Quer ver algum desses assuntos?";

/** Preço de referência (dólar por milhão de tokens) do Gemini Flash e câmbio estimado: só para o teto de custo. */
const DOLAR_POR_MILHAO_DE_ENTRADA = 0.3;
const DOLAR_POR_MILHAO_DE_SAIDA = 2.5;
const REAIS_POR_DOLAR = 6;

const ENDERECO_DO_GEMINI = "https://generativelanguage.googleapis.com";

/** O endereço da API. O simulado dos testes só vale em localhost: a chave nunca vai para outro servidor. */
export function enderecoDoGemini(simulado?: string): string {
  return simulado && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(simulado.trim()) ? simulado.trim().replace(/\/$/, "") : ENDERECO_DO_GEMINI;
}

export interface UsoDeTokens {
  inputTokens: number;
  outputTokens: number;
}

/** Custo estimado em milionésimos de real (1 real = 1.000.000), para somar sem perder as frações de centavo. */
export function custoEstimadoEmMicroReais({ inputTokens, outputTokens }: UsoDeTokens): number {
  const dolares = (inputTokens * DOLAR_POR_MILHAO_DE_ENTRADA + outputTokens * DOLAR_POR_MILHAO_DE_SAIDA) / 1_000_000;
  return Math.ceil(dolares * REAIS_POR_DOLAR * 1_000_000);
}

export interface PedidoAoGemini {
  instrucoes: string;
  pergunta: string;
  /** Teto de palavras da resposta, em tokens. */
  maximoDeTokens?: number;
}

/** Corpo do POST: as instruções vão como systemInstruction e a pergunta como a única fala da pessoa. */
export function corpoDoPedido({ instrucoes, pergunta, maximoDeTokens = 600 }: PedidoAoGemini) {
  return {
    systemInstruction: { parts: [{ text: instrucoes }] },
    contents: [{ role: "user", parts: [{ text: pergunta }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: maximoDeTokens },
  };
}

export type RespostaDoGemini = { texto: string; uso: UsoDeTokens };

/** Lê o texto e o consumo da resposta da API; devolve null se não veio texto (bloqueio de segurança, resposta vazia). */
export function lerRespostaDoGemini(json: unknown): RespostaDoGemini | null {
  const resposta = json as { candidates?: { content?: { parts?: { text?: string }[] } }[]; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } };
  const partes = resposta?.candidates?.[0]?.content?.parts ?? [];
  const texto = partes.map((p) => p.text ?? "").join("").trim();
  if (!texto) return null;
  return { texto, uso: { inputTokens: resposta.usageMetadata?.promptTokenCount ?? 0, outputTokens: resposta.usageMetadata?.candidatesTokenCount ?? 0 } };
}

/** Chama o Gemini. Erro de rede, de chave ou de cota vira null: a Liz cai no guia de ajuda. */
export async function perguntarAoGemini(pedido: PedidoAoGemini, chave: string, modelo: string = MODELO_PADRAO_DO_GEMINI): Promise<RespostaDoGemini | null> {
  try {
    const resposta = await fetch(`${enderecoDoGemini(process.env.GEMINI_SIMULADO_URL)}/v1beta/models/${encodeURIComponent(modelo)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify(corpoDoPedido(pedido)),
      signal: AbortSignal.timeout(20_000),
    });
    if (!resposta.ok) {
      console.error("[Gemini]", resposta.status);
      return null;
    }
    return lerRespostaDoGemini(await resposta.json());
  } catch (erro) {
    console.error("[Gemini]", erro instanceof Error ? erro.name : "erro");
    return null;
  }
}
