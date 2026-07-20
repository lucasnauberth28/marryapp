"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/actions/auth-actions";
import { Lock, User, Loader2, Sparkles, CheckCircle, Heart, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        setError(res.error || "Credenciais inválidas. Tente novamente.");
      }
    } catch (err: any) {
      setError(err.message || "Erro de servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const saasFeatures = [
    { title: "RSVP Inteligente", desc: "Confirmação ativa, acompanhantes com nome e restrições alimentares." },
    { title: "QR Code Check-In", desc: "Credenciamento de convidados via câmera do celular na entrada." },
    { title: "Gestão Financeira", desc: "Controle de despesas e arrecadação de presentes integrados." },
    { title: "Automação WhatsApp", desc: "Disparos inteligentes de lembretes e convites com sistema anti-ban." }
  ];

  return (
    <div className="min-h-screen flex bg-zinc-950 font-sans antialiased text-zinc-200 overflow-hidden">
      
      {/* Lado Esquerdo: Painel Comercial / SaaS (Oculto no mobile) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-emerald-950 via-zinc-950 to-zinc-900 flex-col justify-between p-16 border-r border-zinc-800/50">
        
        {/* Background blobs decorativos */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-700/5 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Heart className="w-5 h-5 text-zinc-950 fill-zinc-950" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white bg-clip-text">
            Marry<span className="text-emerald-400">App</span>
          </span>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 space-y-12 max-w-lg my-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Versão Comercial 2.0
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
              A plataforma definitiva para organizar o grande dia.
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed">
              O MarryApp simplifica a comunicação com convidados, automatiza cobranças e dá controle financeiro total em um painel integrado e profissional.
            </p>
          </div>

          {/* SaaS Pillars list */}
          <div className="grid grid-cols-1 gap-6">
            {saasFeatures.map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex items-start gap-4"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{f.title}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-zinc-600 font-medium">
          MarryApp © {new Date().getFullYear()} — Pronto para o seu casamento e para o mercado.
        </div>
      </div>

      {/* Lado Direito: Formulário Glassmorphism (Centro no Mobile) */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 bg-zinc-950 relative">
        <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none block lg:hidden" />
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile Logo & Header */}
          <div className="text-center space-y-3">
            <div className="lg:hidden inline-flex w-12 h-12 bg-emerald-500 rounded-2xl items-center justify-center mb-2 shadow-lg shadow-emerald-500/20">
              <Heart className="w-6 h-6 text-zinc-950 fill-zinc-950" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Fazer Acesso</h2>
            <p className="text-sm text-zinc-500">
              Digite seu login e senha para gerenciar o painel.
            </p>
          </div>

          {/* Form Card (Glassmorphic) */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-4">
                
                {/* Username Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Usuário</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <User className="w-4 h-4" />
                    </span>
                    <Input
                      type="text"
                      placeholder="seu_usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      className="h-12 pl-11 bg-zinc-900/60 border-zinc-800 rounded-xl focus:border-emerald-500 focus:bg-zinc-900 text-white text-base shadow-inner transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Senha</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-11 bg-zinc-900/60 border-zinc-800 rounded-xl focus:border-emerald-500 focus:bg-zinc-900 text-white text-base shadow-inner tracking-widest transition-all duration-300"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-xl flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span className="font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Autenticando acesso...
                  </>
                ) : (
                  <>
                    Acessar Plataforma
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Hint */}
          <p className="text-center text-xs text-zinc-600">
            Acesso reservado aos noivos e assessores autorizados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// Pequeno ícone de erro importado condicionalmente
function XCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
