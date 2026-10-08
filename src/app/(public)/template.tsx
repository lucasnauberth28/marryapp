// Recria a cada navegação: a página entra com um leve fade (desligado com movimento reduzido).
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
