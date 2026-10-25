// Aviso flutuante que some sozinho, para confirmar o que a pessoa acabou de fazer na tabela.
import { CheckCircle2, X } from "lucide-react";

export interface AvisoDaTabela {
  message: string;
  type: "success" | "error";
}

export function AvisoTemporario({ aviso, aoFechar }: { aviso: AvisoDaTabela; aoFechar: () => void }) {
  const sucesso = aviso.type === "success";
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-300 ${sucesso ? "bg-sucesso-suave text-sucesso border-sucesso/30" : "bg-perigo-suave text-perigo border-perigo/40"}`}>
      {sucesso ? <CheckCircle2 className="w-4 h-4 text-sucesso" /> : <X className="w-4 h-4 text-perigo" />}
      <span>{aviso.message}</span>
      <button onClick={aoFechar} aria-label="Fechar aviso" className="ml-2 text-tinta-suave hover:text-tinta-suave transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
