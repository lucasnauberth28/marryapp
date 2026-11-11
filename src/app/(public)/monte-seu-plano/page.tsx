import { permanentRedirect } from "next/navigation";

// O plano montado por recurso saiu: três planos prontos são mais fáceis de escolher. Links antigos vão para /planos.
export default function MonteSeuPlanoPage() {
  permanentRedirect("/planos");
}
