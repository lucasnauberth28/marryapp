import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDeLista, EsqueletoDoCabecalhoDaPagina, EsqueletoDaGradeDeIndicadores } from "@/components/skeletons";

/**
 * Esqueleto genérico das páginas internas (casal e fornecedor): cabeçalho, números e uma lista.
 * Rede de segurança para `loading.tsx` de telas que ainda não têm esqueleto próprio; quando a tela
 * tiver um layout bem diferente, monte o esqueleto dela com `@/components/skeletons` (ver README).
 */
export function CarregamentoDoPainel({ label = "Carregando a página" }: { label?: string }) {
  return (
    <RegiaoDeCarregamento label={label} className="mx-auto flex max-w-7xl flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina eyebrow={false} />
      <EsqueletoDaGradeDeIndicadores count={3} cols={3} />
      <EsqueletoDeCartao padded={false}>
        <EsqueletoDeLista card={false} rows={5} />
      </EsqueletoDeCartao>
    </RegiaoDeCarregamento>
  );
}
