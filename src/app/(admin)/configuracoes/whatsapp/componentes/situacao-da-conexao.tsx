import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { EsqueletoDoBlocoDeSituacao } from "@/components/painel/skeleton-parts";

function Conectado() {
  return (
    <motion.div key="connected" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center rounded-xl bg-sucesso-suave p-10 text-center text-sucesso">
      <CheckCircle2 className="mb-3 h-12 w-12" aria-hidden="true" />
      <h3 className="font-display text-2xl font-medium">WhatsApp conectado</h3>
      <p className="mt-2 max-w-md text-[15px]">O número está conectado. Os convites e lembretes podem ser enviados pelo painel, nos planos que incluem o WhatsApp.</p>
    </motion.div>
  );
}

function Desconectado({ message }: { message: string }) {
  return (
    <motion.div key="disconnected" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center rounded-xl bg-perigo-suave p-10 text-center text-perigo">
      <XCircle className="mb-3 h-12 w-12" aria-hidden="true" />
      <h3 className="font-display text-2xl font-medium">WhatsApp desconectado</h3>
      <p className="mb-5 mt-2 max-w-md text-[15px]">{message || "O envio pelo WhatsApp está indisponível no momento. Tente de novo mais tarde."}</p>
    </motion.div>
  );
}

export function SituacaoDaConexao({ status, message, loading }: { status: string; message: string; loading: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {loading && status === "LOADING" ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status">
          <span className="sr-only">Verificando a conexão…</span>
          <EsqueletoDoBlocoDeSituacao />
        </motion.div>
      ) : status === "open" || status === "CONNECTED" ? (
        <Conectado />
      ) : (
        <Desconectado message={message} />
      )}
    </AnimatePresence>
  );
}
