"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Heart,
  CheckCircle2,
  QrCode,
  CreditCard as CreditCardIcon,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Calendar,
  Building2,
  User,
  Phone,
  Mail,
  Loader2,
  Copy,
  Check,
  Clock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { WeddingRingsIcon } from "@/components/icons/wedding-rings";
import {
  registerPlanAccount,
  generateSubscriptionPix,
  PlanRegistrationData,
} from "@/actions/subscription-actions";
import { COUPLE_MODULES, calculateCustomPlanPrice } from "@/lib/pricing-modules";
import { toast } from "sonner";

const PLANS_CONFIG = {
  // Casais
  basic: {
    type: "COUPLE" as const,
    name: "Plano Básico",
    price: 0,
    period: "Gratuito",
    badge: "Para Começar",
    features: [
      "Site padrão dos noivos com subdomínio",
      "Lista de presentes com Pix e Cartão",
      "RSVP padrão com controle de convidados",
      "Taxa de 2,99% por presente recebido",
    ],
  },
  classic: {
    type: "COUPLE" as const,
    name: "Plano Classic",
    price: 14900, // R$ 149,00
    period: "Taxa única",
    badge: "Mais Escolhido",
    isPopular: true,
    features: [
      "0% de Taxa no Pix dos Noivos (Saque 100% integral)",
      "Construtor completo No-Code com todos os blocos",
      "Disparos automáticos no WhatsApp dos convidados",
      "Credenciamento com QR Code na portaria",
      "Mural de Recados interativo e Dicas de Traje",
    ],
  },
  vip: {
    type: "COUPLE" as const,
    name: "Plano VIP Premium",
    price: 29900, // R$ 299,00
    period: "Taxa única",
    badge: "Experiência VIP",
    features: [
      "Tudo incluído no Plano Classic",
      "Domínio Próprio (.com.br) gratuito por 1 ano",
      "Álbum Coletivo ao Vivo com QR Code nas mesas",
      "Concierge VIP e suporte prioritário no WhatsApp",
    ],
  },
  // Fornecedores
  start: {
    type: "VENDOR" as const,
    name: "Fornecedor Start",
    price: 0,
    period: "Gratuito",
    badge: "Iniciante",
    features: [
      "Perfil no marketplace público",
      "1 região de atendimento",
      "Até 3 solicitações de orçamento/mês",
    ],
  },
  pro: {
    type: "VENDOR" as const,
    name: "Fornecedor Pro",
    price: 9900, // R$ 99,00
    period: "/ mês",
    badge: "Mais Popular",
    isPopular: true,
    features: [
      "Selo de Fornecedor Verificado",
      "Múltiplas regiões e cidades de atendimento",
      "Orçamentos e leads ilimitados",
      "Agendamento de reuniões online e presenciais",
      "Botão de WhatsApp direto com o casal",
    ],
  },
  master: {
    type: "VENDOR" as const,
    name: "Fornecedor Master Elite",
    price: 24900, // R$ 249,00
    period: "/ mês",
    badge: "Alta Performance",
    features: [
      "Topo das buscas na sua categoria e região",
      "Banner de destaque no feed dos noivos",
      "Painel de Analytics de visualizações e propostas",
      "Envio de propostas e contratos digitais integrados",
    ],
  },
};

export function AssinarClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isCustom = searchParams.get("custom") === "true";
  const modulesParam = searchParams.get("modules")?.split(",").filter(Boolean) || ["site"];
  const customAmountParam = searchParams.get("amount");

  const customCalc = useMemo(() => {
    return calculateCustomPlanPrice(modulesParam);
  }, [modulesParam]);

  const planParam = searchParams.get("plano") || "classic";
  const selectedKey = (planParam.toLowerCase() in PLANS_CONFIG ? planParam.toLowerCase() : "classic") as keyof typeof PLANS_CONFIG;
  
  const currentPlan = isCustom
    ? {
        type: "COUPLE" as const,
        name: "Plano Adaptado",
        price: customAmountParam ? parseInt(customAmountParam, 10) : customCalc.total,
        period: "Taxa única",
        badge: "Personalizado",
        isPopular: true,
        features: customCalc.selectedModules.map((m) => m.name),
      }
    : PLANS_CONFIG[selectedKey];

  const [step, setStep] = useState<"FORM" | "PAYMENT" | "SUCCESS">("FORM");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CARD">("PIX");
  const [isPending, startTransition] = useTransition();

  // Dados do formulário
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vendorCategory, setVendorCategory] = useState("Espaço");
  const [vendorRegion, setVendorRegion] = useState("São Paulo - Capital");

  // Dados de Cobrança Pix e Contador de 10 minutos
  const [pixPayload, setPixPayload] = useState("");
  const [pixExpiresAt, setPixExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutos = 600s
  const [pixCopied, setPixCopied] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(autoSlug);
  };

  // Atualização em tempo real do contador de 10 minutos
  useEffect(() => {
    if (step !== "PAYMENT" || !pixExpiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((pixExpiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [step, pixExpiresAt]);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const formattedTimer = `${minutes}:${seconds}`;
  const isExpiringSoon = timeLeft < 120 && timeLeft > 0;
  const isExpired = timeLeft <= 0;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    startTransition(async () => {
      const payload: PlanRegistrationData = {
        planType: currentPlan.type,
        planId: selectedKey,
        planName: currentPlan.name,
        amount: currentPlan.price,
        name,
        slug,
        email,
        phone,
        password: password || "marryapp123",
        weddingDate: weddingDate ? new Date(weddingDate) : undefined,
        companyName,
        vendorCategory,
        vendorRegion,
      };

      const res = await registerPlanAccount(payload);

      if (res.success) {
        if (res.isFree) {
          toast.success("Conta criada com sucesso! Bem-vindo ao MarryApp ✨");
          router.push(currentPlan.type === "COUPLE" ? "/site-builder" : "/fornecedores");
        } else {
          // Gera a transação Pix com expiração exata de 10 minutos
          const pixRes = await generateSubscriptionPix(payload);
          if (pixRes.success && pixRes.pixPayload) {
            setPixPayload(pixRes.pixPayload);
            setPixExpiresAt(pixRes.expiresAt);
            setTimeLeft(Math.max(0, Math.floor((pixRes.expiresAt - Date.now()) / 1000)));
            setStep("PAYMENT");
          } else {
            toast.error(pixRes.error || "Erro ao gerar cobrança Pix.");
          }
        }
      } else {
        toast.error(res.error || "Erro ao registrar conta.");
      }
    });
  };

  const handleRegeneratePix = () => {
    startTransition(async () => {
      const payload: PlanRegistrationData = {
        planType: currentPlan.type,
        planId: selectedKey,
        planName: currentPlan.name,
        amount: currentPlan.price,
        name,
        slug,
        email,
        phone,
        password: password || "marryapp123",
        weddingDate: weddingDate ? new Date(weddingDate) : undefined,
        companyName,
        vendorCategory,
        vendorRegion,
      };

      const pixRes = await generateSubscriptionPix(payload);
      if (pixRes.success && pixRes.pixPayload) {
        setPixPayload(pixRes.pixPayload);
        setPixExpiresAt(pixRes.expiresAt);
        setTimeLeft(Math.max(0, Math.floor((pixRes.expiresAt - Date.now()) / 1000)));
        toast.success("Novo código Pix gerado com validade de 10 minutos!");
      } else {
        toast.error("Erro ao renovar código Pix.");
      }
    });
  };

  const handleConfirmPaid = () => {
    startTransition(async () => {
      toast.success("Pagamento confirmado com sucesso! Assinatura ativa ✨");
      setStep("SUCCESS");
      setTimeout(() => {
        router.push(currentPlan.type === "COUPLE" ? "/site-builder" : "/fornecedores");
      }, 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-stone-900 font-sans antialiased py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header com Logotipo Oficial de Alianças */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FAF4ED] to-[#FAF8F5] border border-[#8C6D45]/30 flex items-center justify-center text-[#8C6D45] shadow-xs group-hover:scale-105 transition-transform">
              <WeddingRingsIcon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif italic font-bold text-2xl text-stone-900 leading-none">
                MarryApp
              </span>
              <span className="text-[10px] text-stone-400 font-sans tracking-widest uppercase">
                Checkout Seguro
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Ambiente 100% Criptografado</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================================= */}
          {/* COLUNA ESQUERDA: FORMULÁRIO DE CADASTRO OU CHECKOUT PIX */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-stone-200/80 shadow-lg space-y-8">
            {step === "FORM" && (
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900">
                    {currentPlan.type === "COUPLE"
                      ? "1. Crie a Conta do Casal"
                      : "1. Cadastre sua Empresa"}
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1">
                    Preencha os dados básicos para configurar seu painel administrativo.
                  </p>
                </div>

                <div className="space-y-4">
                  {currentPlan.type === "COUPLE" ? (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-stone-700 uppercase">Nomes dos Noivos</Label>
                        <Input
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="Ex: Lucas & Giovanna"
                          required
                          className="rounded-2xl h-12 text-sm bg-stone-50/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-stone-700 uppercase">Endereço do Site (Slug)</Label>
                        <div className="flex items-center bg-stone-50/80 border border-stone-200 rounded-2xl px-3.5 h-12">
                          <span className="text-xs text-stone-400 font-mono">marryapp.com.br/</span>
                          <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="lucas-e-giovanna"
                            required
                            className="flex-1 bg-transparent text-xs font-mono font-bold text-[#8C6D45] outline-none ml-1"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400">Esse será o link exclusivo que seus convidados irão acessar.</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-stone-700 uppercase">Data Prevista do Casamento</Label>
                        <DatePicker
                          value={weddingDate}
                          onChange={(e) => setWeddingDate(e.target.value)}
                          placeholder="Selecione a data prevista"
                          className="rounded-2xl h-12 text-sm bg-stone-50/50"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-stone-700 uppercase">Nome da Empresa / Ateliê</Label>
                        <Input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Ex: Lumière Fotografia & Cinema"
                          required
                          className="rounded-2xl h-12 text-sm bg-stone-50/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-stone-700 uppercase">Categoria</Label>
                          <Select value={vendorCategory} onValueChange={setVendorCategory}>
                            <SelectTrigger className="rounded-2xl h-12 bg-stone-50/50 border-stone-200 text-xs font-bold">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Espaço">Espaço</SelectItem>
                              <SelectItem value="Buffet">Buffet</SelectItem>
                              <SelectItem value="Fotografia">Fotografia</SelectItem>
                              <SelectItem value="Decoração">Decoração</SelectItem>
                              <SelectItem value="DJ & Som">DJ & Som</SelectItem>
                              <SelectItem value="Vestidos">Vestidos</SelectItem>
                              <SelectItem value="Doces & Bolo">Doces & Bolo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-stone-700 uppercase">Região Principal</Label>
                          <Select value={vendorRegion} onValueChange={setVendorRegion}>
                            <SelectTrigger className="rounded-2xl h-12 bg-stone-50/50 border-stone-200 text-xs font-bold">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="São Paulo - Capital">São Paulo - Capital</SelectItem>
                              <SelectItem value="Grande SP">Grande SP</SelectItem>
                              <SelectItem value="Litoral Norte">Litoral Norte</SelectItem>
                              <SelectItem value="Campinas e Região">Campinas e Região</SelectItem>
                              <SelectItem value="Vale do Paraíba">Vale do Paraíba</SelectItem>
                              <SelectItem value="Brasil Todo">Atende Brasil Todo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-stone-700 uppercase">Nome do Responsável</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome completo"
                          required
                          className="rounded-2xl h-12 text-sm bg-stone-50/50"
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-stone-700 uppercase">E-mail de Acesso</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        required
                        className="rounded-2xl h-12 text-sm bg-stone-50/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-stone-700 uppercase">WhatsApp</Label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        required
                        className="rounded-2xl h-12 text-sm bg-stone-50/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-stone-700 uppercase">Defina uma Senha Segura</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo de 6 dígitos"
                      required
                      className="rounded-2xl h-12 text-sm bg-stone-50/50"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-14 text-base shadow-md gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : currentPlan.price === 0 ? (
                    <>
                      <span>Criar Conta Gratuita</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Continuar para Pagamento Pix</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* ========================================================================= */}
            {/* ETAPA 2: CHECKOUT PIX COM CONTADOR DE 10 MINUTOS */}
            {/* ========================================================================= */}
            {step === "PAYMENT" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold font-serif text-stone-900">
                      2. Pagamento via Pix
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Escaneie ou copie o código para ativação instantânea.
                    </p>
                  </div>

                  {/* Contador de Expiração de 10 minutos */}
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all shadow-xs ${
                      isExpired
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : isExpiringSoon
                        ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                        : "bg-[#FAF4ED] text-[#8C6D45] border border-[#8C6D45]/30"
                    }`}
                  >
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      {isExpired ? "Pix Expirado" : `Expira em: ${formattedTimer}`}
                    </span>
                  </div>
                </div>

                {/* Seletor de Método */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("PIX")}
                    className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentMethod === "PIX"
                        ? "bg-[#FAF4ED] border-[#8C6D45] text-[#8C6D45] shadow-xs"
                        : "bg-stone-50 border-stone-200 text-stone-600"
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-[#8C6D45]" />
                    <span>Pix Instantâneo (0% taxa)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentMethod === "CARD"
                        ? "bg-[#FAF4ED] border-[#8C6D45] text-[#8C6D45] shadow-xs"
                        : "bg-stone-50 border-stone-200 text-stone-600"
                    }`}
                  >
                    <CreditCardIcon className="w-4 h-4 text-[#8C6D45]" />
                    <span>Cartão de Crédito (até 12x)</span>
                  </button>
                </div>

                {/* Bloco Pix com QR Code Real e Timer */}
                {paymentMethod === "PIX" && (
                  <div className="bg-[#FAF8F5] p-6 sm:p-8 rounded-3xl border border-stone-200 text-center space-y-6">
                    {!isExpired ? (
                      <>
                        {/* QR Code Real Renderizado com SVG de Alta Resolução */}
                        <div className="w-56 h-56 mx-auto bg-white p-4 rounded-3xl border-2 border-[#8C6D45]/30 shadow-md flex items-center justify-center">
                          {pixPayload ? (
                            <QRCodeSVG
                              value={pixPayload}
                              size={190}
                              level="M"
                              includeMargin={false}
                            />
                          ) : (
                            <Loader2 className="w-8 h-8 animate-spin text-[#8C6D45]" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-stone-800">
                            Abra o aplicativo do seu banco e escaneie o código QR
                          </p>
                          <p className="text-[11px] text-stone-500">
                            A liberação do seu plano é processada e ativada no mesmo instante.
                          </p>
                        </div>

                        {/* Pix Copia e Cola */}
                        <div className="space-y-2 pt-2 border-t border-stone-200/80">
                          <p className="text-xs text-stone-600 font-medium">Ou copie o código Pix abaixo:</p>
                          <div className="flex items-center gap-2">
                            <Input
                              readOnly
                              value={pixPayload}
                              className="bg-white border-stone-200 font-mono text-[11px] h-12 truncate"
                            />
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(pixPayload);
                                setPixCopied(true);
                                toast.success("Código Pix copiado para a área de transferência!");
                                setTimeout(() => setPixCopied(false), 3000);
                              }}
                              variant="outline"
                              className="rounded-2xl h-12 px-5 text-xs font-bold gap-1.5 border-stone-300 hover:bg-stone-100 shrink-0"
                            >
                              {pixCopied ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-stone-600" />
                              )}
                              <span>{pixCopied ? "Copiado!" : "Copiar Código"}</span>
                            </Button>
                          </div>
                        </div>

                        <Button
                          onClick={handleConfirmPaid}
                          disabled={isPending}
                          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-full font-bold h-14 text-sm gap-2 shadow-lg cursor-pointer"
                        >
                          {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              <span>Já Realizei o Pagamento via Pix</span>
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      /* Estado de Pix Expirado após 10 minutos */
                      <div className="py-8 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold font-serif text-stone-900">
                            Transação Pix Expirada
                          </h3>
                          <p className="text-xs text-stone-500 max-w-sm mx-auto">
                            O prazo máximo de 10 minutos deste código expirou por segurança. Clique abaixo para gerar um novo código imediatamente.
                          </p>
                        </div>

                        <Button
                          onClick={handleRegeneratePix}
                          disabled={isPending}
                          className="bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-12 px-6 text-xs gap-2 shadow-md"
                        >
                          {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          <span>Gerar Novo Pix com 10 Minutos</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Detalhes Cartão de Crédito */}
                {paymentMethod === "CARD" && (
                  <div className="bg-[#FAF8F5] p-6 sm:p-8 rounded-3xl border border-stone-200 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-stone-700 uppercase">Número do Cartão</Label>
                      <Input placeholder="0000 0000 0000 0000" className="bg-white rounded-2xl h-12 font-mono text-sm" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-stone-700 uppercase">Nome Impresso no Cartão</Label>
                      <Input placeholder="NOME COMO NO CARTAO" className="bg-white rounded-2xl h-12 text-sm uppercase" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-stone-700 uppercase">Validade (MM/AA)</Label>
                        <Input placeholder="12/30" className="bg-white rounded-2xl h-12 font-mono text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-stone-700 uppercase">CVV</Label>
                        <Input placeholder="123" className="bg-white rounded-2xl h-12 font-mono text-sm" />
                      </div>
                    </div>

                    <Button
                      onClick={handleConfirmPaid}
                      disabled={isPending}
                      className="w-full bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-14 text-sm gap-2 mt-4 cursor-pointer shadow-md"
                    >
                      {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
                      <span>Pagar com Cartão com Segurança</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === "SUCCESS" && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
                  Assinatura Ativada com Sucesso!
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  Seu painel está sendo liberado e preparado para você. Redirecionando...
                </p>
                <Loader2 className="w-5 h-5 animate-spin text-[#8C6D45] mx-auto mt-4" />
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* COLUNA DIREITA: RESUMO DO PLANO ESCOLHIDO */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#FAF4ED] to-white p-8 rounded-3xl border-2 border-[#8C6D45]/30 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <Badge className="bg-[#8C6D45] text-white font-extrabold text-[10px] uppercase tracking-wider">
                {currentPlan.badge}
              </Badge>
              <span className="text-xs text-stone-400 font-bold">
                {currentPlan.type === "COUPLE" ? "Casal" : "Fornecedor"}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-bold font-serif text-stone-900">
                {currentPlan.name}
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-stone-900 font-serif">
                  {currentPlan.price === 0
                    ? "Grátis"
                    : new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(currentPlan.price / 100)}
                </span>
                <span className="text-xs text-stone-500 font-medium">{currentPlan.period}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200/80 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Itens incluídos:
              </span>
              <ul className="space-y-2 text-xs text-stone-700 font-medium">
                {currentPlan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#8C6D45] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-stone-200/80 space-y-2 text-stone-500 text-[11px]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ativação Imediata após a confirmação.</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sem taxas ocultas ou renovações forçadas.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
