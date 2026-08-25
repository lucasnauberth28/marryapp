"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { WeddingRingsIcon } from "@/components/icons/wedding-rings";
import { registerPlanAccount, PlanRegistrationData } from "@/actions/subscription-actions";
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
      "Site do Casal padrão com subdomínio",
      "Lista de presentes com Pix e Cartão",
      "Taxa de 2,99% por presente recebido",
      "Confirmação de presença (RSVP) padrão",
      "Suporte por e-mail",
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
      "Construtor No-Code com todos os blocos",
      "0% DE TAXA NO PIX (Saque 100% integral)",
      "Disparos automáticos de convites no WhatsApp",
      "Lembretes de RSVP com botões interativos",
      "Credenciamento com QR Code na recepção",
      "Mural de Recados & Guia de Trajes",
      "Gestão de mesas e relatórios de buffet",
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
      "Domínio Próprio Personalizado (.com.br) por 1 ano",
      "Álbum Coletivo ao Vivo nas Mesas com projeção",
      "Concierge VIP dedicado via WhatsApp",
      "Sem qualquer taxa no Pix dos Noivos",
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
      "Perfil no Marketplace de Fornecedores",
      "1 região de atendimento cadastrada",
      "Até 3 solicitações de orçamento por mês",
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

import { COUPLE_MODULES, calculateCustomPlanPrice } from "@/lib/pricing-modules";

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

  // Dados de simulação Pix
  const [pixCopied, setPixCopied] = useState(false);
  const mockPixPayload = "00020126580014br.gov.bcb.pix0136119677947445204000053039865802BR5915MarryApp Pagamentos6009Sao Paulo62070503***6304ABCD";

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
          setStep("PAYMENT");
        }
      } else {
        toast.error(res.error || "Erro ao registrar conta.");
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
              <span className="text-[9px] tracking-widest text-[#8C6D45] font-extrabold uppercase">
                Checkout Seguro
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs text-stone-500 font-bold">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Ambiente 100% Criptografado</span>
          </div>
        </div>

        {/* Layout de Checkout com 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================================= */}
          {/* COLUNA ESQUERDA: FORMULÁRIO DE CADASTRO OU PAGAMENTO */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6">
            {step === "FORM" && (
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-stone-900">
                    {currentPlan.type === "COUPLE" ? "1. Dados do Casal" : "1. Dados da Sua Empresa"}
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Crie seu acesso para gerenciar o seu plano no MarryApp.
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
                        <Label className="text-xs font-bold text-stone-700 uppercase">Link Personalizado do Casamento</Label>
                        <div className="flex items-center rounded-2xl border border-stone-200 bg-stone-50/50 px-3.5 h-12">
                          <span className="text-xs text-stone-400 font-mono">marryapp.com.br/casamento/</span>
                          <input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            placeholder="lucas-e-giovanna"
                            className="flex-1 bg-transparent text-xs font-mono font-bold text-[#8C6D45] outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400">Esse será o link exclusivo que seus convidados irão acessar.</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-stone-700 uppercase">Data Prevista do Casamento</Label>
                        <Input
                          type="date"
                          value={weddingDate}
                          onChange={(e) => setWeddingDate(e.target.value)}
                          className="rounded-2xl h-12 text-sm bg-stone-50/50 font-mono"
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
                          <select
                            value={vendorCategory}
                            onChange={(e) => setVendorCategory(e.target.value)}
                            className="w-full bg-stone-50/50 border border-stone-200 rounded-2xl h-12 px-4 text-xs font-bold"
                          >
                            <option value="Espaço">Espaço</option>
                            <option value="Buffet">Buffet</option>
                            <option value="Fotografia">Fotografia</option>
                            <option value="Decoração">Decoração</option>
                            <option value="DJ & Som">DJ & Som</option>
                            <option value="Vestidos">Vestidos</option>
                            <option value="Doces & Bolo">Doces & Bolo</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-stone-700 uppercase">Região Principal</Label>
                          <select
                            value={vendorRegion}
                            onChange={(e) => setVendorRegion(e.target.value)}
                            className="w-full bg-stone-50/50 border border-stone-200 rounded-2xl h-12 px-4 text-xs font-bold"
                          >
                            <option value="São Paulo - Capital">São Paulo - Capital</option>
                            <option value="Grande SP">Grande SP</option>
                            <option value="Litoral Norte">Litoral Norte</option>
                            <option value="Campinas e Região">Campinas e Região</option>
                            <option value="Vale do Paraíba">Vale do Paraíba</option>
                            <option value="Brasil Todo">Atende Brasil Todo</option>
                          </select>
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
                      <Label className="text-xs font-bold text-stone-700 uppercase">E-mail para Acesso</Label>
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
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        required
                        className="rounded-2xl h-12 text-sm bg-stone-50/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-stone-700 uppercase">Criar Senha de Acesso</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
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
                      <span>Continuar para Pagamento</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === "PAYMENT" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-stone-900">
                    2. Pagamento da Assinatura
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Escolha a forma de pagamento para ativar seu plano imediatamente.
                  </p>
                </div>

                {/* Seletor de Método de Pagamento */}
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

                {/* Detalhes Pix */}
                {paymentMethod === "PIX" && (
                  <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-stone-200 text-center space-y-4">
                    <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <QrCode className="w-28 h-28 mx-auto text-stone-900" />
                        <span className="text-[10px] text-stone-400 font-mono block">Escaneie no app do banco</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-stone-600 font-medium">Ou copie o código Pix abaixo:</p>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={mockPixPayload}
                          className="bg-white border-stone-200 font-mono text-[11px] h-11"
                        />
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(mockPixPayload);
                            setPixCopied(true);
                            toast.success("Código Pix copiado!");
                            setTimeout(() => setPixCopied(false), 3000);
                          }}
                          variant="outline"
                          className="rounded-2xl h-11 px-4 text-xs font-bold gap-1 border-stone-300"
                        >
                          {pixCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          <span>Copiar</span>
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handleConfirmPaid}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-full font-bold h-12 text-sm gap-2 mt-4"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Já Realizei o Pagamento via Pix</span>
                    </Button>
                  </div>
                )}

                {/* Detalhes Cartão de Crédito */}
                {paymentMethod === "CARD" && (
                  <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-stone-200 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-stone-700 uppercase">Número do Cartão</Label>
                      <Input placeholder="0000 0000 0000 0000" className="bg-white rounded-2xl h-11 font-mono text-sm" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-stone-700 uppercase">Nome Impresso no Cartão</Label>
                      <Input placeholder="NOME COMO NO CARTAO" className="bg-white rounded-2xl h-11 text-sm uppercase" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-stone-700 uppercase">Validade (MM/AA)</Label>
                        <Input placeholder="12/30" className="bg-white rounded-2xl h-11 font-mono text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-stone-700 uppercase">CVV</Label>
                        <Input placeholder="123" className="bg-white rounded-2xl h-11 font-mono text-sm" />
                      </div>
                    </div>

                    <Button
                      onClick={handleConfirmPaid}
                      className="w-full bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-12 text-sm gap-2 mt-4"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Pagar com Cartão com Segurança</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === "SUCCESS" && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold font-serif text-stone-900">
                  Assinatura Ativada com Sucesso!
                </h3>
                <p className="text-xs text-stone-500">
                  Redirecionando para o seu painel de controle...
                </p>
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#8C6D45]" />
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* COLUNA DIREITA: RESUMO DO PLANO ESCOLHIDO */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#FAF4ED] to-white p-8 rounded-3xl border-2 border-[#8C6D45]/30 shadow-md space-y-6">
            <div className="flex items-center justify-between">
              <Badge className="bg-[#8C6D45] text-white font-extrabold text-[10px] uppercase tracking-wider">
                {currentPlan.badge}
              </Badge>
              <span className="text-xs text-stone-400 font-bold uppercase">
                {currentPlan.type === "COUPLE" ? "Plano para Noivos" : "Plano para Fornecedores"}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-bold font-serif text-stone-900">{currentPlan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-stone-900">
                  {currentPlan.price === 0
                    ? "Grátis"
                    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        currentPlan.price / 100
                      )}
                </span>
                <span className="text-xs text-stone-500 font-medium">{currentPlan.period}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200/80 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                O que está incluso no seu plano:
              </span>
              <ul className="space-y-2.5">
                {currentPlan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-stone-700 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-stone-200/80 flex items-center gap-3 text-xs text-stone-500">
              <ShieldCheck className="w-5 h-5 text-[#8C6D45] shrink-0" />
              <span>Garantia de 7 dias ou seu dinheiro de volta sem complicações.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
