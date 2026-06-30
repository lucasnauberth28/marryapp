"use client";

import { useState } from "react";
import { findGuestByPhone, publicConfirmRsvp } from "@/actions/guest-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, CheckCircle2, XCircle } from "lucide-react";

import { QRCodeSVG } from "qrcode.react";

export function RsvpClient() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState<any>(null);
  
  const [companions, setCompanions] = useState(0);
  const [dietary, setDietary] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successStatus, setSuccessStatus] = useState<"CONFIRMED" | "DECLINED" | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGuest(null);
    setLoading(true);

    try {
      const found = await findGuestByPhone(phone);
      if (found) {
        setGuest(found);
        setCompanions(found.allowedCompanions);
        setDietary(found.dietaryRestrictions || "");
      } else {
        setError("Não encontramos um convite para este número. Verifique se digitou corretamente (com DDD).");
      }
    } catch (err) {
      setError("Erro ao buscar convite.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (status: "CONFIRMED" | "DECLINED") => {
    setSubmitLoading(true);
    setError("");
    
    try {
      const res = await publicConfirmRsvp(guest.id, status, companions, dietary);
      if (res.success) {
        setSuccessStatus(status);
      } else {
        setError(res.error || "Erro ao salvar a resposta.");
      }
    } catch (err) {
      setError("Erro de servidor.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (successStatus) {
    return (
      <Card className="w-full max-w-md shadow-lg border-zinc-200">
        <CardContent className="pt-8 flex flex-col items-center text-center space-y-6">
          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          
          {successStatus === "CONFIRMED" ? (
            <>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">Presença Confirmada!</h2>
                <p className="text-zinc-600 mt-2">Estamos muito felizes que você vem celebrar conosco.</p>
              </div>
              
              <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 w-full flex flex-col items-center">
                <p className="text-sm font-semibold text-zinc-800 mb-4 uppercase tracking-wider">Seu Ingresso (QR Code)</p>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <QRCodeSVG value={`GUEST:${guest.id}`} size={180} />
                </div>
                <p className="text-xs text-zinc-500 mt-4 px-4">
                  Apresente este QR Code na entrada do evento para liberar seu acesso rapidamente.
                </p>
              </div>
            </>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Que pena!</h2>
              <p className="text-zinc-600 mt-2">Sentiremos muito sua falta, mas agradecemos por nos avisar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-zinc-200">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-zinc-900">Confirme sua Presença</CardTitle>
        <CardDescription>
          Por favor, digite o número do seu WhatsApp (com DDD) para localizar seu convite.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!guest ? (
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="Ex: 11999998888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-zinc-100 p-4 rounded-lg text-center">
              <h3 className="font-semibold text-lg">{guest.name}</h3>
              {guest.allowedCompanions > 0 ? (
                <p className="text-sm text-zinc-500 mt-1">
                  Seu convite permite até {guest.allowedCompanions} acompanhante(s).
                </p>
              ) : (
                <p className="text-sm text-zinc-500 mt-1">Convite individual.</p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Você ou seus acompanhantes possuem alguma restrição alimentar?
                </label>
                <Input 
                  placeholder="Ex: Vegano, Intolerante a lactose, Alergia a amendoim..."
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <p className="text-center font-medium text-zinc-900 mb-4">Você poderá comparecer?</p>
                
                {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleConfirm("CONFIRMED")} 
                    disabled={submitLoading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sim, eu vou!"}
                  </Button>
                  <Button 
                    onClick={() => handleConfirm("DECLINED")}
                    disabled={submitLoading}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Não poderei ir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
