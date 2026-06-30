import { Loader2 } from "lucide-react";

export default function LoadingConvidados() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400">
      <Loader2 className="w-12 h-12 animate-spin mb-4 text-zinc-300" />
      <p className="text-zinc-500 animate-pulse">Carregando lista de convidados...</p>
    </div>
  );
}
