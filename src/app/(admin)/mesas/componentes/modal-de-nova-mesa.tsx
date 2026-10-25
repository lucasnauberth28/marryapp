import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { criarMesa } from "@/actions/table-actions";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { estiloDaCaixaDeErro, estiloDoBotao } from "@/components/painel/styles";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { Entrada } from "@/components/ui/input";

const LUGARES_PADRAO = 10;
const ERRO_PADRAO = "Não deu para criar a mesa. Tente de novo.";

interface PropriedadesDosCampos {
  nome: string;
  aoMudarNome: (nome: string) => void;
  lugares: number;
  aoMudarLugares: (lugares: number) => void;
  invalido: boolean;
}

function CamposDaNovaMesa({ nome, aoMudarNome, lugares, aoMudarLugares, invalido }: PropriedadesDosCampos) {
  return (
    <>
      <Entrada id="new-table-name" label="Nome da mesa" value={nome} onChange={(e) => aoMudarNome(e.target.value)} placeholder="Ex.: Mesa dos padrinhos" autoComplete="off" invalid={invalido} />
      <Entrada
        id="new-table-capacity"
        type="number"
        inputMode="numeric"
        min={1}
        max={500}
        label="Lugares"
        value={Number.isFinite(lugares) ? lugares : ""}
        onChange={(e) => aoMudarLugares(parseInt(e.target.value))}
      />
    </>
  );
}

export function ModalDeNovaMesa({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [lugares, setLugares] = useState(LUGARES_PADRAO);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return setErro("Dê um nome à mesa, por exemplo: Mesa dos padrinhos.");
    setErro(null);
    setCarregando(true);
    const idDoAviso = toast.loading("Criando a mesa...");
    const res = await criarMesa(nome, Number.isFinite(lugares) ? lugares : LUGARES_PADRAO);
    if (res.success) {
      toast.success("Mesa criada.", { id: idDoAviso });
      setNome("");
      setLugares(LUGARES_PADRAO);
      onClose();
      router.refresh();
    } else {
      toast.error(res.error || ERRO_PADRAO, { id: idDoAviso });
      setErro(res.error || ERRO_PADRAO);
    }
    setCarregando(false);
  }

  return (
    <ModalPersonalizado isOpen={isOpen} onClose={onClose} title="Nova mesa" description="Escolha um nome e quantos lugares a mesa tem." size="sm">
      <form onSubmit={criar} className="flex flex-col gap-5">
        <CamposDaNovaMesa nome={nome} aoMudarNome={setNome} lugares={lugares} aoMudarLugares={setLugares} invalido={!!erro} />
        {erro && (
          <p role="alert" className={estiloDaCaixaDeErro}>
            {erro}
          </p>
        )}
        <BotaoComCarregamento type="submit" loading={carregando} className={`${estiloDoBotao.primary} ${estiloDoBotao.block}`}>
          Criar mesa
        </BotaoComCarregamento>
      </form>
    </ModalPersonalizado>
  );
}
