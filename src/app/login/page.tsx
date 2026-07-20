"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/actions/auth-actions";
import { Lock, User, Loader2, Sparkles, CheckCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
        setError(res.error || "Credenciais incorretas. Verifique e tente novamente.");
      }
    } catch (err: any) {
      setError(err.message || "Erro de servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const saasFeatures = [
    { title: "Confirmação de Presença Elegante", desc: "Fluxo de RSVP otimizado com acompanhantes individuais e restrições alimentares." },
    { title: "Credenciamento por QR Code", desc: "Check-in digital rápido na recepção do evento através do celular da assessoria." },
    { title: "Planejamento Financeiro", desc: "Controle de despesas, cronograma de pagamentos e mural de presentes integrados." },
    { title: "Comunicação via WhatsApp", desc: "Disparos inteligentes e automatizados de lembretes e convites oficiais." }
  ];

  return (
    <div className="min-h-screen flex bg-[#FAF8F5] font-sans antialiased text-stone-800 overflow-hidden relative">
      
      {/* Injeção dinâmica de fontes elegantes de Casamento (Google Fonts) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-serif-wedding {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .font-sans-wedding {
          font-family: 'Outfit', sans-serif;
        }
      `}} />

      {/* Lado Esquerdo: Painel de Apresentação e Marketing (62% da tela) */}
      <div className="hidden lg:flex lg:w-[62%] relative overflow-hidden bg-gradient-to-br from-[#FCFBF9] via-[#FAF6F0] to-[#F3EDE2] flex-col justify-between p-16 border-r border-stone-200/50">
        
        {/* Blobs de Luz Champanhe/Dourados para criar profundidade */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#C5A880]/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[#E5D5C0]/15 blur-[90px] pointer-events-none" />

        {/* Logo Superior */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C5A880] to-[#A3855E] flex items-center justify-center shadow-md shadow-amber-900/10">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.5 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-wider text-stone-800 font-sans-wedding">
            MARRY<span className="text-[#C5A880]">APP</span>
          </span>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 space-y-10 max-w-xl my-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A880]/10 border border-[#C5A880]/20 text-[#A3855E] text-xs font-semibold font-sans-wedding tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-[#C5A880]" /> Gestão de Casamentos Premium
            </div>
            <h1 className="text-4xl xl:text-5xl font-normal leading-tight text-stone-900 font-serif-wedding">
              Gerencie cada detalhe da celebração <br />
              <span className="italic text-[#C5A880] font-light">do seu felizes para sempre.</span>
            </h1>
            <p className="text-stone-500 text-sm font-sans-wedding leading-relaxed max-w-lg">
              Simplifique o relacionamento com seus convidados, acompanhe a saúde financeira do evento e integre todas as etapas organizacionais em um único produto SaaS comercial de alta costura.
            </p>
          </div>

          {/* SaaS Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {saasFeatures.map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-[#C5A880]/15 flex items-center justify-center shrink-0 mt-0.5 border border-[#C5A880]/30">
                  <CheckCircle className="w-3 h-3 text-[#A3855E]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-800 text-xs font-sans-wedding tracking-wide">{f.title}</h4>
                  <p className="text-[11px] text-stone-400 leading-relaxed font-sans-wedding">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[11px] text-stone-400 font-sans-wedding font-medium">
          MarryApp © {new Date().getFullYear()} — Tecnologia e sofisticação para assessoria de grandes eventos.
        </div>
      </div>

      {/* Lado Direito: Formulário Minimalista & Estético (38% da tela) */}
      <div className="w-full lg:w-[38%] flex flex-col justify-center items-center p-8 bg-[#FAF8F5] relative">
        {/* Glow dourado de fundo no mobile */}
        <div className="absolute top-[10%] right-[10%] w-[250px] h-[250px] rounded-full bg-[#C5A880]/5 blur-[70px] pointer-events-none block lg:hidden" />
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[340px] space-y-6"
        >
          {/* Cabeçalho e Logo de Alianças */}
          <div className="text-center space-y-2.5">
            {/* Logo Alianças de Casamento Entrelaçadas */}
            <div className="inline-flex items-center justify-center text-[#C5A880] mb-1">
              <svg className="w-10 h-10 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="8.5" cy="12" r="4.5" />
                <circle cx="15.5" cy="12" r="4.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-medium tracking-wide text-stone-900 font-serif-wedding">Acesso ao Painel</h2>
            <p className="text-xs text-stone-400 font-sans-wedding">
              Insira suas credenciais de acesso comercial.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-stone-200/60 rounded-3xl p-7 shadow-lg shadow-stone-200/30">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-4">
                
                {/* Username Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-sans-wedding">Usuário</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <User className="w-3.5 h-3.5" />
                    </span>
                    <Input
                      type="text"
                      placeholder="admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      className="h-11 pl-9 bg-stone-50 border-stone-200 rounded-xl focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/15 text-stone-800 text-sm font-sans-wedding transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-sans-wedding">Senha</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-9 pr-10 bg-stone-50 border-stone-200 rounded-xl focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/15 text-stone-800 text-sm font-sans-wedding tracking-widest transition-all duration-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none"
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

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-[11px] text-red-700 bg-red-50 border border-red-100 py-2.5 px-3 rounded-xl flex items-center gap-2 font-sans-wedding"
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span className="font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-11 text-xs font-bold tracking-wider bg-gradient-to-r from-[#C5A880] to-[#A3855E] hover:from-[#B4946B] hover:to-[#8F714B] text-white rounded-xl shadow-md shadow-amber-900/10 flex items-center justify-center gap-1.5 hover:-translate-y-0.5 transition-all duration-300 font-sans-wedding uppercase"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validando acesso...
                  </>
                ) : (
                  <>
                    Acessar Plataforma
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Hint */}
          <p className="text-center text-[10px] text-stone-400 font-sans-wedding">
            Ambiente comercial protegido e criptografado.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// Ícone de erro em SVG
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
