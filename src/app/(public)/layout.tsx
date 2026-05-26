export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans antialiased text-zinc-900">
      {/* Header Premium para Convidados */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm leading-none">L&G</span>
            </div>
            <span className="font-bold text-xl text-zinc-900 tracking-tight">
              Lucas & Giovanna
            </span>
          </div>
          <span className="text-sm font-medium text-zinc-400 italic">
            Nosso Casamento ❤️
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-zinc-200/50 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-zinc-400">
          Lucas & Giovanna © 2026 — Feito com ❤️ para o nosso grande dia
        </div>
      </footer>
    </div>
  )
}
