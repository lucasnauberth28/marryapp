// Só consulta o estado: a conexão é do Aceito (compartilhada) e quem reconecta é a administração da plataforma.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { obterSituacaoDoWhatsapp } from "@/actions/evolution-actions";

const ERRO_DE_CONSULTA = "Não deu para consultar a conexão agora. Tente de novo em instantes.";

export function useSituacaoDoWhatsapp() {
  const [status, setStatus] = useState<string>("LOADING");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async (isManualRefresh = false, toastId?: string | number) => {
    try {
      const statusRes = await obterSituacaoDoWhatsapp();
      const conectado = statusRes.state === "open" || statusRes.state === "CONNECTED";
      setStatus(conectado ? "CONNECTED" : statusRes.state || "DISCONNECTED");
      setMessage("");
      if (!isManualRefresh) return;
      if (conectado) toast.success("O WhatsApp está conectado e pronto para enviar.", { id: toastId });
      else toast.error("O envio pelo WhatsApp está indisponível agora.", { id: toastId });
    } catch {
      setStatus("ERROR");
      setMessage(ERRO_DE_CONSULTA);
      if (isManualRefresh) toast.error(ERRO_DE_CONSULTA, { id: toastId });
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshManually = () => {
    setLoading(true);
    const toastId = toast.loading("Verificando a conexão com o WhatsApp…");
    checkStatus(true, toastId);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial na Evolution API (sistema externo); setState só após o await
    checkStatus();
  }, [checkStatus]);

  return { status, message, loading, refreshManually };
}
