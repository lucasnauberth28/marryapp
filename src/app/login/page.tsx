"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "@/actions/auth-actions";
import { Lock, Loader2 } from "lucide-react";

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
      // login agora aceita password e opcionalmente username
      const res = await login(password, username);
      if (res.success) {
        // Redirecionamento é tratado pelo middleware na próxima navegação 
        // ou recarregamos para forçar a avaliação das novas permissões
        window.location.href = "/dashboard";
      } else {
        setError(res.error || "Erro ao fazer login.");
      }
    } catch (err: any) {
      setError(err.message || "Erro de servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-zinc-200/60">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
            <Lock className="text-white w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Acesso ao Sistema</CardTitle>
          <CardDescription>
            Entre com suas credenciais para gerenciar o casamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Login de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="h-12 text-center text-lg tracking-wide"
                required
              />
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-center text-lg tracking-widest"
                required
              />
            </div>
            
            {error && (
              <p className="text-sm text-red-500 text-center font-medium">{error}</p>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-zinc-900 text-white hover:bg-zinc-800"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
