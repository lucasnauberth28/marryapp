import { Plus } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { estiloDoBotao } from "@/components/landing/styles";
import { AbasDeAcesso } from "@/components/casal/access-tabs";

interface PropriedadesDoCabecalhoDoAcesso {
  /** Dentro do shell /admin as abas e o cabeçalho vêm da página; sem isto, a tela antiga. */
  embedded: boolean;
  formularioAberto: boolean;
  aba: "usuarios" | "perfis";
  descricao: string;
  rotuloDoBotao: string;
  aoNovo: () => void;
}

/** Cabeçalho das telas de usuários e perfis, com o botão de criar (escondido enquanto o formulário está aberto). */
export function CabecalhoDoAcesso({ embedded, formularioAberto, aba, descricao, rotuloDoBotao, aoNovo }: PropriedadesDoCabecalhoDoAcesso) {
  const botao = (
    <button type="button" onClick={aoNovo} className={estiloDoBotao.primary}>
      <Plus className="size-4" aria-hidden="true" /> {rotuloDoBotao}
    </button>
  );
  if (embedded) return formularioAberto ? null : <div className="flex justify-end">{botao}</div>;
  return (
    <>
      <CabecalhoDaPagina eyebrow="Acesso" title="Usuários e perfis" description={descricao} actions={!formularioAberto && botao} />
      <AbasDeAcesso current={aba} />
    </>
  );
}
