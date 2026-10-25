import { EsqueletoDoTituloDeAcesso, EsqueletoDoMoldeDeAcesso } from "@/components/account/auth-shell-skeleton";
import { EsqueletoDeFormulario } from "@/components/skeletons";

// O link é conferido no servidor: enquanto isso, a moldura de acesso com título e os dois campos de senha.
export default function RedefinirSenhaLoading() {
  return (
    <EsqueletoDoMoldeDeAcesso label="o link de nova senha">
      <div className="flex flex-col gap-6">
        <EsqueletoDoTituloDeAcesso />
        <EsqueletoDeFormulario fields={2} />
      </div>
    </EsqueletoDoMoldeDeAcesso>
  );
}
