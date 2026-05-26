"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Loader2, Lock } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6 antialiased">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-zinc-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Logo/Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            Lucas & Giovanna
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Acesso Restrito aos Noivos
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white p-8 rounded-[32px] border border-zinc-200/60 shadow-xl shadow-zinc-100/50">
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                E-mail
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="seu-email@exemplo.com"
                className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-900 focus-visible:bg-white transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-900 focus-visible:bg-white transition-all text-sm"
              />
            </div>

            {/* Error Message */}
            {state?.error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600 animate-in shake duration-300">
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Entrar no Painel
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Minimal Footer */}
        <p className="text-center text-xs text-zinc-400">
          Esqueceu sua senha? Solicite via painel do Supabase.
        </p>
      </div>
    </div>
  );
}
