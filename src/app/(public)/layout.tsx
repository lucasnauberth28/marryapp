export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main id="conteudo" className="min-h-screen bg-transparent">{children}</main>;
}
