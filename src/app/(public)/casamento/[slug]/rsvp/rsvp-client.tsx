"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { findGuestByPhone, publicConfirmRsvp } from "@/actions/guest-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, CheckCircle2, Gift, Download, Users, Heart } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { weddingSitePath } from "@/lib/wedding-links";

// Função para aplicar máscara de telefone brasileiro: (XX) XXXXX-XXXX
const maskPhone = (value: string) => {
  const num = value.replace(/\D/g, "");
  if (num.length <= 2) return num;
  if (num.length <= 6) return `(${num.slice(0, 2)}) ${num.slice(2)}`;
  if (num.length <= 10) return `(${num.slice(0, 2)}) ${num.slice(2, 6)}-${num.slice(6)}`;
  return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7, 11)}`;
};

interface RsvpClientProps {
  /** Casamento do endereço: a busca e a confirmação ficam restritas a ele */
  slug: string;
  coupleNames: string;
  initials: string;
  dateLabel: string | null;
}

export function RsvpClient({ slug, coupleNames, initials, dateLabel }: RsvpClientProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState<NonNullable<Awaited<ReturnType<typeof findGuestByPhone>>> | null>(null);
  
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
      const found = await findGuestByPhone(slug, phone);
      if (found) {
        setGuest(found);
        // Inicializa contagem e lista de nomes vazias
        setCompanionsCount(0);
        setCompanionsNames(Array(found.allowedCompanions).fill(""));
        setDietary(found.dietaryRestrictions || "");
      } else {
        setError("Não achamos um convite com este número. Use o WhatsApp com DDD que os noivos têm de você. Se ainda não achar, fale com eles.");
      }
    } catch {
      setError("Não conseguimos buscar o convite agora. Tente de novo em instantes.");
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
    if (!guest) return;
    setSubmitLoading(true);
    setError("");

    // Une os nomes preenchidos dos acompanhantes ativos
    const activeNames = companionsNames
      .slice(0, companionsCount)
      .filter((n) => n.trim() !== "")
      .join(", ");

    try {
      const res = await publicConfirmRsvp(
        slug,
        guest.id, 
        status, 
        status === "CONFIRMED" ? companionsCount : 0, 
        status === "CONFIRMED" ? activeNames : "", 
        dietary
      );
      if (res.success) {
        setSuccessStatus(status);
      } else {
        setError(res.error || "Não conseguimos salvar a sua resposta. Tente de novo.");
      }
    } catch {
      setError("Sem conexão com o servidor. Confira a internet e tente de novo.");
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
    link.download = `ingresso-${guest?.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download do seu ingresso digital iniciado! 🎟️");
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
            <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-papel">
              <div className="h-2 bg-gradient-to-r from-brand-300 to-brand" />
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-brand" aria-hidden="true" />
                </div>
                
                {successStatus === "CONFIRMED" ? (
                  <>
                    <div className="space-y-2">
                      <h2 className="font-display text-3xl text-tinta">Presença confirmada!</h2>
                      <p className="text-sm text-tinta-suave px-4">
                        Tudo certo! Mal podemos esperar para viver esse momento com você.
                      </p>
                    </div>
                    
                    <div className="bg-linho p-6 rounded-2xl border border-linha/80 w-full flex flex-col items-center shadow-inner">
                      <p className="text-xs font-bold text-tinta-suave uppercase tracking-widest mb-4">Seu ingresso digital</p>
                      <div ref={qrRef} className="bg-papel p-4 rounded-xl shadow-md border border-linha">
                        <QRCodeCanvas value={`GUEST:${guest?.id ?? ""}`} size={160} level="H" />
                      </div>
                      
                      <Button 
                        onClick={downloadQrCode} 
                        variant="outline" 
                        size="sm" 
                        className="mt-4 h-11 w-full border-linha-forte text-tinta hover:bg-areia/50 shadow-sm"
                      >
                        <Download className="w-4 h-4 mr-2" aria-hidden="true" /> Salvar o ingresso como imagem
                      </Button>
                      
                      <p className="text-xs text-tinta-suave mt-4 px-2">
                        Mostre este QR Code na entrada para entrar mais rápido. Salve a imagem no celular, caso a internet falhe lá.
                      </p>
                    </div>

                    <Button asChild className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-12 shadow-md">
                      <a href={weddingSitePath(slug, "presentes")} className="flex items-center justify-center gap-2">
                        <Gift className="w-4 h-4" aria-hidden="true" />
                        Ver a lista de presentes
                      </a>
                    </Button>
                    <Button variant="ghost" onClick={() => setSuccessStatus(null)} className="h-11 w-full text-tinta-suave">
                      Mudar minha resposta
                    </Button>
                  </>
                ) : (
                  <div className="py-6 space-y-4">
                    <h2 className="font-display text-3xl text-tinta">Obrigado por avisar</h2>
                    <p className="text-sm text-tinta-suave px-4">
                      Vamos sentir a sua falta no nosso grande dia, mas agradecemos por responder e ajudar na organização.
                    </p>
                    <Button variant="ghost" onClick={() => setSuccessStatus(null)} className="h-11 text-tinta-suave">
                      Mudar minha resposta
                    </Button>
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
            <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-papel">
              <CardHeader className="text-center pt-8 pb-4">
                <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand/15">
                  <Heart className="w-6 h-6 text-brand fill-brand/20" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Casamento de</p>
                <p className="font-display text-3xl text-tinta leading-tight">{coupleNames}</p>
                {dateLabel && <p className="text-sm text-tinta-suave">{dateLabel}</p>}
                <CardTitle className="pt-4 text-xl font-semibold text-tinta">Confirme sua presença</CardTitle>
                <CardDescription className="text-tinta-suave text-sm px-2">
                  Digite o seu WhatsApp com DDD para encontrarmos o seu convite.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <form onSubmit={handleSearch} className="space-y-3">
                  <Input
                    type="tel"
                    name="phone"
                    inputMode="tel"
                    autoComplete="tel-national"
                    aria-label="Seu WhatsApp com DDD"
                    aria-describedby={error ? "rsvp-erro" : undefined}
                    aria-invalid={error ? true : undefined}
                    placeholder="Ex.: (11) 99999-9999"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="h-12 w-full rounded-xl bg-linho/50 px-4 text-base focus:bg-papel"
                    required
                  />
                  <Button type="submit" disabled={loading} className="h-12 w-full gap-2 rounded-xl bg-brand text-base font-semibold text-white shadow-md hover:bg-brand-600">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Search className="w-5 h-5" aria-hidden="true" />}
                    {loading ? "Procurando..." : "Encontrar meu convite"}
                  </Button>
                  {error && (
                    <motion.p
                      id="rsvp-erro"
                      role="alert"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-perigo font-semibold text-center bg-perigo-suave border border-perigo/20 py-2.5 px-3 rounded-lg"
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
            <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-papel">
              <CardHeader className="bg-linho/50 border-b border-linha p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">{initials}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-tinta text-base leading-tight">{guest.name}</h3>
                    <p className="text-xs text-tinta-suave font-medium mt-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-tinta-suave" />
                      {guest.allowedCompanions > 0 
                        ? `Seu convite permite até ${guest.allowedCompanions} acompanhante(s)` 
                        : "Convite individual"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {guest.rsvpStatus !== "PENDING" && (
                  <p className="rounded-xl bg-linho px-3 py-2 text-sm text-tinta-suave">
                    Você já respondeu: {guest.rsvpStatus === "CONFIRMED" ? "vai ao casamento" : "não vai poder ir"}. Se mudou de ideia, é só responder de novo.
                  </p>
                )}

                {/* Seletor de Acompanhantes */}
                {guest.allowedCompanions > 0 && (
                  <div className="space-y-2">
                    <label htmlFor="rsvp-acompanhantes" className="block text-sm font-semibold text-tinta">
                      Quantos acompanhantes você vai levar?
                    </label>
                    <Select
                      value={String(companionsCount)}
                      onValueChange={(val) => setCompanionsCount(Number(val))}
                    >
                      <SelectTrigger id="rsvp-acompanhantes" className="w-full h-11 bg-linho border border-linha-forte rounded-xl text-tinta text-sm font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: guest.allowedCompanions + 1 }).map((_, i) => (
                          <SelectItem key={i} value={String(i)} className="text-sm font-medium">
                            {i === 0 ? "Nenhum acompanhante" : i === 1 ? "1 acompanhante" : `${i} acompanhantes`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Inputs Dinâmicos de Acompanhantes */}
                <AnimatePresence>
                  {companionsCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden border-t border-linha pt-4"
                    >
                      <p className="block text-sm font-semibold text-tinta">
                        Nome de cada acompanhante
                      </p>
                      {Array.from({ length: companionsCount }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Input
                            type="text"
                            aria-label={`Nome completo do acompanhante ${i + 1}`}
                            autoComplete="off"
                            placeholder={`Nome completo do acompanhante ${i + 1}`}
                            value={companionsNames[i] || ""}
                            onChange={(e) => handleCompanionNameChange(i, e.target.value)}
                            className="h-11 rounded-lg text-sm bg-linho/30"
                            required
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Restrições Alimentares */}
                <div className={`space-y-2 ${guest.allowedCompanions > 0 ? "border-t border-linha pt-4" : ""}`}>
                  <label htmlFor="rsvp-restricoes" className="block text-sm font-semibold text-tinta">
                    Alguma restrição alimentar ou alergia? <span className="font-normal text-tinta-suave">(opcional)</span>
                  </label>
                  <Input
                    id="rsvp-restricoes"
                    placeholder="Ex.: vegano, sem lactose"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    className="h-11 rounded-xl text-sm"
                    aria-describedby="rsvp-restricoes-dica"
                  />
                  <p id="rsvp-restricoes-dica" className="text-xs text-tinta-suave">Se não tiver nenhuma, é só deixar em branco.</p>
                </div>

                {/* Botões de Ação */}
                <div className="pt-4 border-t border-linha space-y-4">
                  <p className="text-center font-semibold text-tinta">Podemos contar com você?</p>
                  
                  {error && <p role="alert" className="text-sm text-perigo font-semibold text-center bg-perigo-suave py-2 px-3 rounded-lg">{error}</p>}

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={() => handleConfirm("CONFIRMED")} 
                      disabled={submitLoading}
                      className="bg-brand hover:bg-brand-600 text-white rounded-xl h-12 font-semibold shadow-md shadow-brand/10"
                    >
                      {submitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sim, eu vou!"}
                    </Button>
                    <Button 
                      onClick={() => handleConfirm("DECLINED")}
                      disabled={submitLoading}
                      variant="outline"
                      className="border-linha text-tinta-suave hover:bg-linho rounded-xl h-12 font-semibold"
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
