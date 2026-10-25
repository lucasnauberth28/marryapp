/**
 * Escopo sempre claro SEM efeito no resto da página: para prévias do site do casal dentro de telas
 * que seguem o tema (editor do site, convite de exemplo). Para a página inteira use ThemeLight,
 * que também trava o <html> em claro.
 */
export function EscopoClaro({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div data-theme="light" className={`bg-linho text-tinta ${className ?? ""}`}>
      {children}
    </div>
  );
}
