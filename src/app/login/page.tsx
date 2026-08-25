"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/actions/auth-actions";
import { Lock, User, Loader2, CheckCircle2, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WeddingRingsIcon } from "@/components/icons/wedding-rings";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await login(password, username);
      if (res.success) {
        window.location.href = "/dashboard";
      } else {
        setError(res.error || "Credenciais incorretas. Verifique seu e-mail e senha.");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const saasFeatures = [
    {
      title: "Confirmação de Presença Inteligente",
      desc: "Fluxo de RSVP otimizado com acompanhantes individuais e restrições alimentares.",
    },
    {
      title: "Credenciamento por QR Code",
      desc: "Check-in digital rápido na portaria através do celular dos cerimonialistas.",
    },
    {
      title: "Planejamento Financeiro",
      desc: "Controle de despesas, cronograma de pagamentos e mural de presentes com taxa zero no Pix.",
    },
    {
      title: "Automações via WhatsApp",
      desc: "Disparos inteligentes e automatizados de lembretes e convites oficiais.",
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#FAF8F5] font-sans antialiased text-stone-900 overflow-hidden relative">
      {/* Lado Esquerdo: Painel de Apresentação e Marketing (62% da tela) */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-gradient-to-br from-[#FCFBF9] via-[#FAF6F0] to-[#F5EFE6] flex-col justify-between p-16 border-r border-stone-200/60">
        {/* Brilhos Sutis Dourados de Fundo */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#8C6D45]/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[#C5A880]/15 blur-[90px] pointer-events-none" />

        {/* Logo Superior com o Novo Padrão de Alianças */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FAF4ED] to-[#FAF8F5] border border-[#8C6D45]/30 flex items-center justify-center text-[#8C6D45] shadow-xs group-hover:scale-105 transition-transform">
              <WeddingRingsIcon className="w-6 h-6" />
            </div>
            <span className="font-serif italic font-bold text-2xl text-stone-900 tracking-tight leading-none">
              MarryApp
            </span>
          </Link>
        </div>

        {/* Hero Section sem badges soltas e com a fonte serif padrão */}
        <div className="relative z-10 space-y-8 max-w-xl my-auto">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-black leading-tight text-stone-900 font-serif">
              Gerencie cada detalhe da celebração <br />
              <span className="italic text-[#8C6D45]">do seu casamento dos sonhos.</span>
            </h1>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-lg font-sans">
              Simplifique o relacionamento com seus convidados, acompanhe a saúde financeira do evento e integre todas as etapas organizacionais em uma plataforma completa e sofisticada.
            </p>
          </div>

          {/* Lista de Recursos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {saasFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-[#FAF4ED] flex items-center justify-center shrink-0 mt-0.5 border border-[#8C6D45]/30 text-[#8C6D45]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-bold text-stone-900 text-xs font-serif tracking-wide">
                    {f.title}
                  </h2>
                  <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Rodapé da Coluna Esquerda */}
        <div className="relative z-10 text-[11px] text-stone-400 font-sans font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>MarryApp © {new Date().getFullYear()} — Tecnologia e sofisticação para noivos e profissionais de eventos.</span>
        </div>
      </div>

      {/* Lado Direito: Formulário de Login (40% da tela) */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center items-center p-8 bg-[#FAF8F5] relative">
        {/* Glow dourado de fundo no mobile */}
        <div className="absolute top-[10%] right-[10%] w-[250px] h-[250px] rounded-full bg-[#8C6D45]/5 blur-[70px] pointer-events-none block lg:hidden" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[360px] space-y-6"
        >
          {/* Logotipo e Título Central com a Fonte Padrão do Sistema */}
          <div className="text-center space-y-3">
            <Link href="/" className="inline-flex items-center justify-center">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-[#FAF4ED] to-[#FAF8F5] border border-[#8C6D45]/30 flex items-center justify-center text-[#8C6D45] shadow-sm hover:scale-105 transition-transform">
                <WeddingRingsIcon className="w-8 h-8" />
              </div>
            </Link>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 font-serif">
                Acesso à Plataforma
              </h2>
              <p className="text-xs text-stone-500 font-sans">
                Insira seu e-mail e senha para gerenciar seu casamento.
              </p>
            </div>
          </div>

          {/* Card do Formulário */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-8 shadow-xl space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* Campo Usuário / E-mail */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    E-mail de Acesso
                  </Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <User className="w-4 h-4" />
                    </span>
                    <Input
                      type="text"
                      placeholder="seuemail@exemplo.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      className="h-12 pl-10 bg-stone-50/60 border-stone-200 rounded-2xl text-stone-800 text-sm font-sans"
                      required
                    />
                  </div>
                </div>

                {/* Campo Senha */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Senha
                    </Label>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-10 pr-11 bg-stone-50/60 border-stone-200 rounded-2xl text-stone-800 text-sm font-sans tracking-wider"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Exibição de Erro */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-red-700 bg-red-50 border border-red-200 py-3 px-4 rounded-2xl flex items-center gap-2.5 font-sans"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botão de Entrar com Padrão Visual do Sistema */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-sm font-bold bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Validando acesso...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Links de Apoio */}
          <div className="text-center space-y-2 pt-2">
            <p className="text-xs text-stone-500 font-sans">
              Ainda não tem uma conta?{" "}
              <Link
                href="/assinar"
                className="font-bold text-[#8C6D45] hover:underline underline-offset-4"
              >
                Criar conta ou assinar plano
              </Link>
            </p>
            <p className="text-[11px] text-stone-400 font-sans">
              Ambiente protegido e criptografado de ponta a ponta.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
