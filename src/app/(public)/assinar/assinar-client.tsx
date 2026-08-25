"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
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
  ArrowLeft,
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
  Globe,
  Camera,
  FileText,
  DollarSign,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  Video,
  MapPin,
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
      "Perfil no marketplace após curadoria",
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
      "Selo de Fornecedor Verificado pela Curadoria",
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
  const [vendorStep, setVendorStep] = useState<1 | 2 | 3>(1); // Etapas do fornecedor
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CARD">("PIX");
  const [isPending, startTransition] = useTransition();

  // Dados do Casal
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [weddingDate, setWeddingDate] = useState("");

  // Dados Completos do Fornecedor
  const [companyName, setCompanyName] = useState("");
  const [vendorCategory, setVendorCategory] = useState("Espaço");
  const [vendorRegion, setVendorRegion] = useState("São Paulo - Capital");
  const [documentType, setDocumentType] = useState("CNPJ");
  const [documentNumber, setDocumentNumber] = useState("");
  const [startingPriceStr, setStartingPriceStr] = useState("");
  const [averageTicketStr, setAverageTicketStr] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");
  const [offersOnlineMeet, setOffersOnlineMeet] = useState(true);
  const [hasPhysicalSpace, setHasPhysicalSpace] = useState(false);
  const [address, setAddress] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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

  // Cálculo ao vivo de faixa de preço para o fornecedor
  const calculatedPriceRange = useMemo(() => {
    const rawVal = (averageTicketStr || startingPriceStr).replace(/\D/g, "");
    if (!rawVal) return "$$";
    const val = parseFloat(rawVal);
    if (val <= 3000) return "$";
    if (val <= 8000) return "$$";
    if (val <= 20000) return "$$$";
    return "$$$$";
  }, [averageTicketStr, startingPriceStr]);

  // Upload do Logotipo (leitura local para base64 com preview instantâneo)
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O logotipo deve ter no máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
      toast.success("Logotipo carregado com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  // Upload de Fotos do Portfólio (múltiplas)
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`A imagem ${file.name} ultrapassa 8MB e foi ignorada.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          newImages.push(reader.result as string);
        }
        processed++;
        if (processed === files.length) {
          setGalleryImages((prev) => [...prev, ...newImages].slice(0, 8));
          toast.success(`${newImages.length} fotos adicionadas ao seu portfólio!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
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

  // Validação de etapas do fornecedor
  const handleNextVendorStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (vendorStep === 1) {
      if (!companyName || !documentNumber || !name || !email || !phone || !password) {
        toast.error("Preencha todos os campos obrigatórios da Etapa 1.");
        return;
      }
      setVendorStep(2);
      return;
    }
    if (vendorStep === 2) {
      setVendorStep(3);
      return;
    }
    if (vendorStep === 3) {
      handleRegisterFinal();
    }
  };

  const handleRegisterFinal = () => {
    const startingPriceCents = startingPriceStr
      ? Math.round(parseFloat(startingPriceStr.replace(/\D/g, "")) * 100)
      : undefined;

    const averageTicketCents = averageTicketStr
      ? Math.round(parseFloat(averageTicketStr.replace(/\D/g, "")) * 100)
      : undefined;

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
        documentType,
        documentNumber,
        startingPrice: startingPriceCents,
        averageTicket: averageTicketCents,
        priceRange: calculatedPriceRange,
        logoUrl: logoUrl || undefined,
        galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
        instagram: instagram || undefined,
        tiktok: tiktok || undefined,
        website: website || undefined,
      };

      const res = await registerPlanAccount(payload);

      if (res.success) {
        if (res.isFree) {
          if (currentPlan.type === "VENDOR") {
            toast.success("Cadastro recebido! Seu perfil está em análise pela curadoria MarryApp ✨");
          } else {
            toast.success("Conta criada com sucesso! Bem-vindo ao MarryApp ✨");
          }
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
      const startingPriceCents = startingPriceStr
        ? Math.round(parseFloat(startingPriceStr.replace(/\D/g, "")) * 100)
        : undefined;

      const averageTicketCents = averageTicketStr
        ? Math.round(parseFloat(averageTicketStr.replace(/\D/g, "")) * 100)
        : undefined;

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
        documentType,
        documentNumber,
        startingPrice: startingPriceCents,
        averageTicket: averageTicketCents,
        priceRange: calculatedPriceRange,
        logoUrl: logoUrl || undefined,
        galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
        instagram: instagram || undefined,
        tiktok: tiktok || undefined,
        website: website || undefined,
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
        {/* Header com Logotipo Oficial Sutil */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#FAF4ED] flex items-center justify-center text-[#8C6D45] group-hover:scale-105 transition-transform">
              <WeddingRingsIcon className="w-5 h-5" />
            </div>
            <span className="font-serif italic font-bold text-2xl text-stone-900 leading-none">
              MarryApp
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Ambiente 100% Criptografado</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================================= */}
          {/* COLUNA ESQUERDA: FORMULÁRIO DE CADASTRO (CASAL OU WIZARD DE FORNECEDOR) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-stone-200/80 shadow-lg space-y-8">
            {step === "FORM" && (
              <div>
                {/* 💍 FLUXO SIMPLES PARA CASAIS */}
                {currentPlan.type === "COUPLE" ? (
                  <form onSubmit={handleRegisterFinal} className="space-y-6">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900">
                        1. Crie a Conta do Casal
                      </h1>
                      <p className="text-xs sm:text-sm text-stone-500 mt-1">
                        Preencha os dados básicos para configurar seu painel e site de casamento.
                      </p>
                    </div>

                    <div className="space-y-4">
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
                      className="w-full bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-14 text-base shadow-md gap-2 cursor-pointer"
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
                ) : (
                  /* 🤝 WIZARD COMPLETO EM ETAPAS PARA FORNECEDORES */
                  <form onSubmit={handleNextVendorStep} className="space-y-6">
                    {/* Barra de Progresso de Etapas do Fornecedor */}
                    <div className="space-y-3 pb-2 border-b border-stone-100">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={vendorStep >= 1 ? "text-[#8C6D45]" : "text-stone-400"}>
                          1. Dados & CNPJ
                        </span>
                        <span className={vendorStep >= 2 ? "text-[#8C6D45]" : "text-stone-400"}>
                          2. Portfólio & Fotos
                        </span>
                        <span className={vendorStep >= 3 ? "text-[#8C6D45]" : "text-stone-400"}>
                          3. Valores & Atendimento
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#8C6D45] transition-all duration-300 rounded-full"
                          style={{ width: `${(vendorStep / 3) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Banner de Curadoria */}
                    <div className="bg-[#FAF8F5] border border-[#8C6D45]/30 rounded-2xl p-4 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-[#8C6D45] shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-stone-900">Curadoria & Segurança MarryApp</p>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          Para proteger os noivos e valorizar fornecedores legítimos, todo perfil passa por auditoria prévia antes de ser listado publicamente.
                        </p>
                      </div>
                    </div>

                    {/* ========================================================= */}
                    {/* ETAPA 1 DO FORNECEDOR: DADOS DO NEGÓCIO & RESPONSÁVEL */}
                    {/* ========================================================= */}
                    {vendorStep === 1 && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-stone-700 uppercase">
                            Nome Comercial da Empresa / Ateliê
                          </Label>
                          <Input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Ex: Lumière Fotografia & Cinema"
                            required
                            className="rounded-2xl h-12 text-sm bg-stone-50/50"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                        {/* Documento Obrigatório para Curadoria */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                          <div className="sm:col-span-4 space-y-1.5">
                            <Label className="text-xs font-bold text-stone-700 uppercase">Tipo Documento</Label>
                            <Select value={documentType} onValueChange={setDocumentType}>
                              <SelectTrigger className="rounded-2xl h-12 bg-stone-50/50 border-stone-200 text-xs font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CNPJ">CNPJ (Empresa)</SelectItem>
                                <SelectItem value="CPF">CPF (Autônomo)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="sm:col-span-8 space-y-1.5">
                            <Label className="text-xs font-bold text-stone-700 uppercase">
                              Número do {documentType}
                            </Label>
                            <Input
                              value={documentNumber}
                              onChange={(e) => setDocumentNumber(e.target.value)}
                              placeholder={documentType === "CNPJ" ? "00.000.000/0001-00" : "000.000.000-00"}
                              required
                              className="rounded-2xl h-12 text-sm bg-stone-50/50 font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <Label className="text-xs font-bold text-stone-700 uppercase">Nome do Responsável Legal</Label>
                          <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Seu nome completo"
                            required
                            className="rounded-2xl h-12 text-sm bg-stone-50/50"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-stone-700 uppercase">E-mail Comercial</Label>
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="contato@suaempresa.com"
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
                          <Label className="text-xs font-bold text-stone-700 uppercase">Senha de Acesso ao Painel</Label>
                          <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo de 6 dígitos"
                            required
                            className="rounded-2xl h-12 text-sm bg-stone-50/50"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-14 text-sm shadow-md gap-2 mt-4 cursor-pointer"
                        >
                          <span>Avançar para Portfólio & Fotos</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* ETAPA 2 DO FORNECEDOR: UPLOAD DE LOGOTIPO & FOTOS DO SERVIÇO */}
                    {/* ========================================================= */}
                    {vendorStep === 2 && (
                      <div className="space-y-6">
                        {/* 1. Logotipo de Apresentação */}
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-bold text-stone-700 uppercase block">
                              Logotipo Oficial / Foto de Perfil
                            </Label>
                            <p className="text-[11px] text-stone-500">
                              Faça o upload do logo ou insira o link da imagem da sua marca.
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Preview do Logo */}
                            <div className="w-20 h-20 rounded-2xl bg-[#FAF4ED] border-2 border-dashed border-[#8C6D45]/40 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                              {logoUrl ? (
                                <img
                                  src={logoUrl}
                                  alt="Logo Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Building2 className="w-8 h-8 text-[#8C6D45]/60" />
                              )}
                            </div>

                            <div className="space-y-2 flex-1">
                              <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                              />

                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => logoInputRef.current?.click()}
                                  className="rounded-2xl h-10 px-4 text-xs font-bold border-stone-300 gap-1.5"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Fazer Upload do Logo</span>
                                </Button>

                                {logoUrl && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setLogoUrl("")}
                                    className="rounded-2xl h-10 px-3 text-xs text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>

                              <Input
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="Ou cole o link direto da imagem..."
                                className="rounded-xl h-9 text-xs bg-stone-50/50 font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 2. Upload de Fotos do Serviço Prestado (Portfólio) */}
                        <div className="space-y-3 pt-4 border-t border-stone-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-xs font-bold text-stone-700 uppercase block">
                                Fotos dos Serviços Prestados (Portfólio)
                              </Label>
                              <p className="text-[11px] text-stone-500">
                                Envie até 8 fotos reais de casamentos anteriores para encantar os noivos.
                              </p>
                            </div>

                            <input
                              ref={galleryInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleGalleryChange}
                              className="hidden"
                            />

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => galleryInputRef.current?.click()}
                              className="rounded-2xl h-10 px-4 text-xs font-bold border-[#8C6D45]/40 text-[#8C6D45] hover:bg-[#FAF4ED] gap-1.5 shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Adicionar Fotos</span>
                            </Button>
                          </div>

                          {/* Grid de Miniaturas de Fotos */}
                          {galleryImages.length === 0 ? (
                            <div
                              onClick={() => galleryInputRef.current?.click()}
                              className="p-8 border-2 border-dashed border-stone-200 rounded-3xl text-center space-y-2 bg-stone-50/40 hover:bg-stone-50 cursor-pointer transition-colors"
                            >
                              <Camera className="w-8 h-8 mx-auto text-stone-400" />
                              <p className="text-xs font-bold text-stone-700">
                                Clique para selecionar as fotos dos seus trabalhos
                              </p>
                              <p className="text-[10px] text-stone-400">
                                Formatos aceitos: JPG, PNG, WEBP (Até 8MB por foto)
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {galleryImages.map((img, i) => (
                                <div
                                  key={i}
                                  className="relative group rounded-2xl overflow-hidden h-24 bg-stone-100 border border-stone-200"
                                >
                                  <img
                                    src={img}
                                    alt={`Foto ${i + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeGalleryImage(i)}
                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}

                              {galleryImages.length < 8 && (
                                <button
                                  type="button"
                                  onClick={() => galleryInputRef.current?.click()}
                                  className="h-24 rounded-2xl border-2 border-dashed border-stone-200 hover:border-[#8C6D45]/40 flex flex-col items-center justify-center text-stone-400 hover:text-[#8C6D45] transition-colors"
                                >
                                  <Plus className="w-5 h-5" />
                                  <span className="text-[10px] font-bold mt-1">Mais Foto</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 3. Redes Sociais & Website */}
                        <div className="space-y-3 pt-4 border-t border-stone-100">
                          <Label className="text-xs font-bold text-stone-700 uppercase block">
                            Redes Sociais & Site Próprio
                          </Label>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-stone-500 uppercase">Instagram</Label>
                              <Input
                                value={instagram}
                                onChange={(e) => setInstagram(e.target.value)}
                                placeholder="@suaempresa"
                                className="rounded-xl h-10 text-xs bg-stone-50/50"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-stone-500 uppercase">TikTok</Label>
                              <Input
                                value={tiktok}
                                onChange={(e) => setTiktok(e.target.value)}
                                placeholder="@suaempresa"
                                className="rounded-xl h-10 text-xs bg-stone-50/50"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-stone-500 uppercase">Site Oficial</Label>
                              <Input
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="suaempresa.com.br"
                                className="rounded-xl h-10 text-xs bg-stone-50/50"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setVendorStep(1)}
                            className="rounded-full h-14 px-6 text-xs font-bold border-stone-300"
                          >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            <span>Voltar</span>
                          </Button>

                          <Button
                            type="submit"
                            className="flex-1 bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-14 text-sm shadow-md gap-2 cursor-pointer"
                          >
                            <span>Avançar para Valores & Atendimento</span>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* ETAPA 3 DO FORNECEDOR: VALORES, TICKET MÉDIO & ATENDIMENTO */}
                    {/* ========================================================= */}
                    {vendorStep === 3 && (
                      <div className="space-y-6">
                        <div>
                          <Label className="text-xs font-bold text-stone-700 uppercase block">
                            Investimento & Valores Médios
                          </Label>
                          <p className="text-[11px] text-stone-500">
                            Usado para orientar os noivos e classificar a faixa de preço do seu perfil.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-stone-700 uppercase">
                              Valor Inicial dos Serviços (A partir de)
                            </Label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 text-xs font-bold">
                                R$
                              </span>
                              <Input
                                value={startingPriceStr}
                                onChange={(e) => setStartingPriceStr(e.target.value)}
                                placeholder="2.500,00"
                                required
                                className="rounded-2xl h-12 pl-10 text-sm bg-stone-50/50 font-mono"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-stone-700 uppercase">
                              Ticket Médio dos Contratos
                            </Label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 text-xs font-bold">
                                R$
                              </span>
                              <Input
                                value={averageTicketStr}
                                onChange={(e) => setAverageTicketStr(e.target.value)}
                                placeholder="5.000,00"
                                className="rounded-2xl h-12 pl-10 text-sm bg-stone-50/50 font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Preview da Faixa de Preço Calculada */}
                        <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                              Classificação Automática de Faixa:
                            </span>
                            <p className="text-xs font-bold text-stone-900">
                              {calculatedPriceRange === "$" && "$ — Econômico (Até R$ 3.000)"}
                              {calculatedPriceRange === "$$" && "$$ — Moderado (R$ 3.000 a R$ 8.000)"}
                              {calculatedPriceRange === "$$$" && "$$$ — Premium (R$ 8.000 a R$ 20.000)"}
                              {calculatedPriceRange === "$$$$" && "$$$$ — Luxo / Alta Costura (Acima de R$ 20.000)"}
                            </p>
                          </div>
                          <span className="text-lg font-mono font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-xl border border-amber-200">
                            {calculatedPriceRange}
                          </span>
                        </div>

                        {/* Modalidades de Atendimento */}
                        <div className="space-y-3 pt-4 border-t border-stone-100">
                          <Label className="text-xs font-bold text-stone-700 uppercase block">
                            Modalidades de Atendimento aos Noivos
                          </Label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div
                              onClick={() => setOffersOnlineMeet(!offersOnlineMeet)}
                              className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                                offersOnlineMeet
                                  ? "bg-[#FAF4ED] border-[#8C6D45] text-[#8C6D45]"
                                  : "bg-stone-50 border-stone-200 text-stone-600"
                              }`}
                            >
                              <Video className="w-5 h-5 shrink-0" />
                              <div className="text-xs">
                                <p className="font-bold">Reuniões por Vídeo</p>
                                <p className="text-[10px] text-stone-500">Google Meet & Zoom</p>
                              </div>
                            </div>

                            <div
                              onClick={() => setHasPhysicalSpace(!hasPhysicalSpace)}
                              className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                                hasPhysicalSpace
                                  ? "bg-[#FAF4ED] border-[#8C6D45] text-[#8C6D45]"
                                  : "bg-stone-50 border-stone-200 text-stone-600"
                              }`}
                            >
                              <Building2 className="w-5 h-5 shrink-0" />
                              <div className="text-xs">
                                <p className="font-bold">Showroom / Espaço Físico</p>
                                <p className="text-[10px] text-stone-500">Atendimento presencial</p>
                              </div>
                            </div>
                          </div>

                          {hasPhysicalSpace && (
                            <div className="space-y-1.5 pt-2">
                              <Label className="text-xs font-bold text-stone-700 uppercase">
                                Endereço do Showroom / Ateliê
                              </Label>
                              <Input
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Rua, Número, Bairro - Cidade, Estado"
                                className="rounded-2xl h-12 text-xs bg-stone-50/50"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setVendorStep(2)}
                            className="rounded-full h-14 px-6 text-xs font-bold border-stone-300"
                          >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            <span>Voltar</span>
                          </Button>

                          <Button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-14 text-sm shadow-md gap-2 cursor-pointer"
                          >
                            {isPending ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : currentPlan.price === 0 ? (
                              <>
                                <span>Concluir Cadastro & Enviar Curadoria</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                <span>Avançar para Pagamento Pix</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
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
                  {currentPlan.type === "VENDOR"
                    ? "Seu cadastro foi recebido com sucesso e seu painel de parceiro está liberado. Seus dados foram enviados para a curadoria."
                    : "Seu painel está sendo liberado e preparado para você. Redirecionando..."}
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
