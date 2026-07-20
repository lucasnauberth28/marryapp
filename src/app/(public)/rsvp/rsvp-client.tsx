"use client";

import { useState, useRef } from "react";
import { findGuestByPhone, publicConfirmRsvp } from "@/actions/guest-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, CheckCircle2, XCircle, Gift, Download, MapPin, Calendar, Users, Heart } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

// Função para aplicar máscara de telefone brasileiro: (XX) XXXXX-XXXX
const maskPhone = (value: string) => {
  const num = value.replace(/\D/g, "");
  if (num.length <= 2) return num;
  if (num.length <= 6) return `(${num.slice(0, 2)}) ${num.slice(2)}`;
  if (num.length <= 10) return `(${num.slice(0, 2)}) ${num.slice(2, 6)}-${num.slice(6)}`;
  return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7, 11)}`;
};

export function RsvpClient() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState<any>(null);
  
  const [companionsCount, setCompanionsCount] = useState(0);
  const [companionsNames, setCompanionsNames] = useState<string[]>([]);
  const [dietary, setDietary] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successStatus, setSuccessStatus] = useState<"CONFIRMED" | "DECLINED" | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(maskPhone(e.target.value));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGuest(null);
    setLoading(true);

    try {
      const found = await findGuestByPhone(phone);
      if (found) {
        setGuest(found);
        // Inicializa contagem e lista de nomes vazias
        setCompanionsCount(0);
        setCompanionsNames(Array(found.allowedCompanions).fill(""));
        setDietary(found.dietaryRestrictions || "");
      } else {
        setError("Não encontramos um convite para este número. Digite com o DDD.");
      }
    } catch (err) {
      setError("Erro ao buscar convite. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanionNameChange = (index: number, val: string) => {
    const updated = [...companionsNames];
    updated[index] = val;
    setCompanionsNames(updated);
  };

  const handleConfirm = async (status: "CONFIRMED" | "DECLINED") => {
    setSubmitLoading(true);
    setError("");
    
    // Une os nomes preenchidos dos acompanhantes ativos
    const activeNames = companionsNames
      .slice(0, companionsCount)
      .filter((n) => n.trim() !== "")
      .join(", ");

    try {
      const res = await publicConfirmRsvp(
        guest.id, 
        status, 
        status === "CONFIRMED" ? companionsCount : 0, 
        status === "CONFIRMED" ? activeNames : "", 
        dietary
      );
      if (res.success) {
        setSuccessStatus(status);
      } else {
        setError(res.error || "Erro ao salvar resposta.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const downloadQrCode = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `ingresso-${guest.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-md px-4">
      <AnimatePresence mode="wait">
        {/* Passo 1: Sucesso Rsvp */}
        {successStatus ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-white">
              <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                
                {successStatus === "CONFIRMED" ? (
                  <>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Presença Confirmada!</h2>
                      <p className="text-sm text-zinc-500 px-4">
                        Tudo certo! Mal podemos esperar para viver este momento com você.
                      </p>
                    </div>
                    
                    <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200/80 w-full flex flex-col items-center shadow-inner">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Seu Ingresso Digital</p>
                      <div ref={qrRef} className="bg-white p-4 rounded-xl shadow-md border border-zinc-100">
                        <QRCodeCanvas value={`GUEST:${guest.id}`} size={160} level="H" />
                      </div>
                      
                      <Button 
                        onClick={downloadQrCode} 
                        variant="outline" 
                        size="sm" 
                        className="mt-4 w-full border-zinc-200 text-zinc-700 hover:bg-zinc-100/50 shadow-sm"
                      >
                        <Download className="w-4 h-4 mr-2" /> Salvar Ingresso (Imagem)
                      </Button>
                      
                      <p className="text-[11px] text-zinc-400 mt-4 px-2">
                        Apresente a imagem deste QR Code na entrada do evento para liberar seu acesso rapidamente.
                      </p>
                    </div>

                    <Button asChild className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-12 shadow-md">
                      <a href="/presentes" className="flex items-center justify-center gap-2">
                        <Gift className="w-4 h-4" />
                        Ver Lista de Presentes
                      </a>
                    </Button>
                  </>
                ) : (
                  <div className="py-6 space-y-4">
                    <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Agradecemos por Avisar</h2>
                    <p className="text-sm text-zinc-500 px-4">
                      Sentiremos muito a sua falta no nosso grande dia, mas agradecemos por confirmar e nos ajudar na organização!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : !guest ? (
          /* Passo 2: Busca por telefone */
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-white">
              <CardHeader className="text-center pt-8 pb-4">
                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                  <Heart className="w-6 h-6 text-zinc-400 fill-zinc-200" />
                </div>
                <CardTitle className="text-2xl font-extrabold text-zinc-900 tracking-tight">Confirmar Presença</CardTitle>
                <CardDescription className="text-zinc-500 text-sm px-2">
                  Olá! Digite seu telefone (WhatsApp com DDD) para localizarmos seu convite.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="Ex: (11) 99999-9999"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="flex-1 rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white h-12 text-base px-4 shadow-inner"
                      required
                    />
                    <Button type="submit" disabled={loading} className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl w-12 h-12 shrink-0 shadow-md">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    </Button>
                  </div>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="text-xs text-red-500 font-semibold text-center bg-red-50 border border-red-100 py-2.5 px-3 rounded-lg"
                    >
                      {error}
                    </motion.p>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Passo 3: Confirmação e detalhes */
          <motion.div
            key="confirm-flow"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">L&G</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-zinc-900 text-base leading-tight">{guest.name}</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      {guest.allowedCompanions > 0 
                        ? `Seu convite permite até ${guest.allowedCompanions} acompanhante(s)` 
                        : "Convite individual"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Seletor de Acompanhantes */}
                {guest.allowedCompanions > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Quantos acompanhantes você trará?
                    </label>
                    <select
                      value={companionsCount}
                      onChange={(e) => setCompanionsCount(Number(e.target.value))}
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-500 focus:bg-white text-zinc-800 text-sm font-medium transition-all shadow-sm outline-none"
                    >
                      {Array.from({ length: guest.allowedCompanions + 1 }).map((_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? "Nenhum acompanhante" : `${i} acompanhante(s)`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Inputs Dinâmicos de Acompanhantes */}
                <AnimatePresence>
                  {companionsCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden border-t border-zinc-100 pt-4"
                    >
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Nomes dos acompanhantes:
                      </label>
                      {Array.from({ length: companionsCount }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Input
                            type="text"
                            placeholder={`Nome completo do Acompanhante ${i + 1}`}
                            value={companionsNames[i] || ""}
                            onChange={(e) => handleCompanionNameChange(i, e.target.value)}
                            className="h-10 border-zinc-200 rounded-lg text-sm bg-zinc-50/30"
                            required
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Restrições Alimentares */}
                <div className="space-y-2 border-t border-zinc-100 pt-4">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Restrições Alimentares / Alergias?
                  </label>
                  <Input 
                    placeholder="Ex: Vegano, Intolerante a lactose, sem glúten..."
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    className="h-11 border-zinc-200 rounded-xl text-sm"
                  />
                  <p className="text-[10px] text-zinc-400">Deixe em branco se não possuir nenhuma restrição.</p>
                </div>

                {/* Botões de Ação */}
                <div className="pt-4 border-t border-zinc-100 space-y-4">
                  <p className="text-center font-bold text-zinc-800 text-sm">Podemos contar com sua presença?</p>
                  
                  {error && <p className="text-xs text-red-500 font-semibold text-center bg-red-50 py-2 rounded-lg">{error}</p>}

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={() => handleConfirm("CONFIRMED")} 
                      disabled={submitLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-bold shadow-md shadow-emerald-600/10"
                    >
                      {submitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sim, eu vou!"}
                    </Button>
                    <Button 
                      onClick={() => handleConfirm("DECLINED")}
                      disabled={submitLoading}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-12 font-bold"
                    >
                      Não poderei ir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
