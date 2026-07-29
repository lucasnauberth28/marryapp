"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateWalletBalance, createCreditCard, updateCreditCard, deleteCreditCard } from "@/actions/wallet-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Wallet,
  CreditCard as CreditCardIcon,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  DollarSign,
  TrendingUp,
  Landmark,
  Sparkles,
  QrCode,
  ShieldCheck,
} from "lucide-react";

const BANKS = [
  { name: "Nubank", color: "#820AD1" },
  { name: "Itaú", color: "#EC7000" },
  { name: "C6 Bank", color: "#18181B" },
  { name: "Bradesco", color: "#CC092F" },
  { name: "Santander", color: "#EC0000" },
  { name: "Banco do Brasil", color: "#0038A8" },
  { name: "Inter", color: "#FF7A00" },
  { name: "BTG Pactual", color: "#0A1E40" },
  { name: "Caixa", color: "#0066B3" },
  { name: "Outro", color: "#4B5563" },
];

const BRANDS = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard"];

interface CarteiraClientProps {
  initialBalance: number;
  initialCards: any[];
}

export function CarteiraClient({ initialBalance, initialCards }: CarteiraClientProps) {
  const [balance, setBalance] = useState<number>(initialBalance);
  const [cards, setCards] = useState<any[]>(initialCards);

  const [loading, setLoading] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  // Formulário de Saldo
  const [inputBalance, setInputBalance] = useState((initialBalance / 100).toString());

  // Formulário de Cartão
  const [cardForm, setCardForm] = useState({
    bank: "Nubank",
    brand: "Mastercard",
    nickname: "",
    lastDigits: "",
    limit: "",
    color: "#820AD1",
  });

  const formatCurrency = (valInCents: number) => {
    return (valInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const totalCardLimit = cards.reduce((sum, c) => sum + (c.limit || 0), 0);
  const totalAssets = balance + totalCardLimit;

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cents = Math.round(parseFloat(inputBalance.replace(",", ".")) * 100);

    const res = await updateWalletBalance(cents);
    if (res.success) {
      setBalance(cents);
      setBalanceModalOpen(false);
      toast.success("Saldo atualizado com sucesso!");
    } else {
      toast.error(res.error || "Erro ao atualizar saldo.");
    }
    setLoading(false);
  };

  const openNewCardModal = () => {
    setEditingCard(null);
    setCardForm({
      bank: "Nubank",
      brand: "Mastercard",
      nickname: "",
      lastDigits: "",
      limit: "",
      color: "#820AD1",
    });
    setCardModalOpen(true);
  };

  const openEditCardModal = (card: any) => {
    setEditingCard(card);
    setCardForm({
      bank: card.bank || "Outro",
      brand: card.brand || "Visa",
      nickname: card.nickname || "",
      lastDigits: card.lastDigits || "",
      limit: (card.limit / 100).toString(),
      color: card.color || "#18181b",
    });
    setCardModalOpen(true);
  };

  const handleBankChange = (bankName: string) => {
    const found = BANKS.find((b) => b.name === bankName);
    setCardForm((prev) => ({
      ...prev,
      bank: bankName,
      color: found ? found.color : prev.color,
    }));
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("bank", cardForm.bank);
    formData.append("brand", cardForm.brand);
    formData.append("nickname", cardForm.nickname);
    formData.append("lastDigits", cardForm.lastDigits);
    formData.append("limit", cardForm.limit);
    formData.append("color", cardForm.color);

    if (editingCard) {
      const res = await updateCreditCard(editingCard.id, formData);
      if (res.success) {
        setCards(
          cards.map((c) =>
            c.id === editingCard.id
              ? {
                  ...c,
                  bank: cardForm.bank,
                  brand: cardForm.brand,
                  nickname: cardForm.nickname,
                  lastDigits: cardForm.lastDigits,
                  limit: Math.round(parseFloat(cardForm.limit.replace(",", ".")) * 100),
                  color: cardForm.color,
                }
              : c
          )
        );
        setCardModalOpen(false);
        toast.success("Cartão de crédito atualizado!");
      } else {
        toast.error(res.error || "Erro ao atualizar cartão.");
      }
    } else {
      const res = await createCreditCard(formData);
      if (res.success) {
        setCardModalOpen(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Erro ao cadastrar cartão.");
      }
    }
    setLoading(false);
  };

  const handleDeleteCard = (id: string) => {
    setCardToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return;
    const res = await deleteCreditCard(cardToDelete);
    if (res.success) {
      setCards(cards.filter((c) => c.id !== cardToDelete));
      toast.success("Cartão excluído com sucesso.");
    } else {
      toast.error(res.error || "Erro ao excluir cartão.");
    }
    setCardToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header com Título & Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#8C6D45]" />
            Carteira & Meios de Pagamento
          </h1>
          <p className="text-zinc-500 text-xs mt-0.5">
            Gerencie o saldo disponível em conta e cadastre seus cartões de crédito para alocação real das despesas do casamento.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setBalanceModalOpen(true)}
            variant="outline"
            className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold rounded-xl"
          >
            <DollarSign className="w-4 h-4 mr-1.5 text-emerald-600" />
            Editar Saldo em Conta
          </Button>

          <Button
            onClick={openNewCardModal}
            className="bg-[#8C6D45] hover:bg-[#755630] text-white text-xs font-semibold rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Cartão de Crédito
          </Button>
        </div>
      </div>

      {/* Grid de 3 Cards Superiores de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Saldo em Conta */}
        <Card className="p-5 rounded-2xl border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-600" />
              Saldo em Conta / Pix
            </span>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
              Disponível
            </Badge>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 tracking-tight">
              {formatCurrency(balance)}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Recurso fictício/real em conta para compras à vista e pagamentos Pix.
            </p>
          </div>
        </Card>

        {/* Card 2: Limite em Cartões */}
        <Card className="p-5 rounded-2xl border-purple-100 bg-gradient-to-br from-purple-50/60 to-white shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCardIcon className="w-4 h-4 text-purple-600" />
              Limites dos Cartões
            </span>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px]">
              {cards.length} Cartão(ões)
            </Badge>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-950 tracking-tight">
              {formatCurrency(totalCardLimit)}
            </div>
            <p className="text-[11px] text-purple-700 mt-1">
              Soma do limite total cadastrado em cartões de crédito.
            </p>
          </div>
        </Card>

        {/* Card 3: Recursos Totais */}
        <Card className="p-5 rounded-2xl border-amber-100 bg-gradient-to-br from-amber-50/60 to-white shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Poder de Compra Total
            </span>
            <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px]">
              Patrimônio
            </Badge>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-950 tracking-tight">
              {formatCurrency(totalAssets)}
            </div>
            <p className="text-[11px] text-amber-800 mt-1">
              Capacidade financeira combinada (Saldo em Conta + Limites de Crédito).
            </p>
          </div>
        </Card>
      </div>

      {/* Seção de Cartões de Crédito */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-[#8C6D45]" />
            Cartões de Crédito Cadastrados
          </h2>
          <span className="text-xs text-zinc-500 font-medium">
            {cards.length} {cards.length === 1 ? "cartão ativo" : "cartões ativos"}
          </span>
        </div>

        {cards.length === 0 ? (
          <Card className="p-12 text-center text-zinc-400 border-dashed border-zinc-200 space-y-3">
            <CreditCardIcon className="w-10 h-10 mx-auto text-zinc-300" />
            <div>
              <h3 className="font-bold text-sm text-zinc-700">Nenhum cartão cadastrado</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Cadastre seus cartões para saber exatamente de onde sairá o pagamento de cada parcela ou compra.
              </p>
            </div>
            <Button
              onClick={openNewCardModal}
              size="sm"
              className="bg-[#8C6D45] hover:bg-[#755630] text-white text-xs mt-2"
            >
              <Plus className="w-4 h-4 mr-1" /> Adicionar Primeiro Cartão
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map((card) => {
              const bgStyle = card.color || "#18181b";
              return (
                <div
                  key={card.id}
                  style={{ background: bgStyle }}
                  className="rounded-2xl p-5 text-white shadow-lg relative flex flex-col justify-between h-48 border border-white/10 transition-transform duration-200 hover:-translate-y-1"
                >
                  {/* Header do Cartão (Banco & Apelido) */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider opacity-80 block">
                        {card.bank}
                      </span>
                      {card.nickname && (
                        <span className="font-semibold text-sm block mt-0.5">{card.nickname}</span>
                      )}
                    </div>
                    <Badge className="bg-white/20 text-white border-none text-[10px] font-bold">
                      {card.brand}
                    </Badge>
                  </div>

                  {/* Chip do Cartão + Dígitos */}
                  <div className="space-y-2">
                    <div className="w-9 h-7 bg-amber-300/80 rounded-md border border-amber-400/50 flex items-center justify-center">
                      <div className="w-5 h-4 border-y border-amber-600/40" />
                    </div>
                    <div className="font-mono text-base tracking-widest opacity-90">
                      •••• •••• •••• {card.lastDigits || "••••"}
                    </div>
                  </div>

                  {/* Rodapé do Cartão (Limite & Ações) */}
                  <div className="flex justify-between items-end pt-2 border-t border-white/15">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider opacity-70 block">
                        Limite Atual
                      </span>
                      <span className="font-black text-sm">{formatCurrency(card.limit)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditCardModal(card)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                        title="Editar Cartão"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/80 text-white transition cursor-pointer"
                        title="Excluir Cartão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO DO SALDO EM CONTA */}
      <Dialog open={balanceModalOpen} onOpenChange={setBalanceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Editar Saldo em Conta / Pix
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateBalance} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-semibold text-zinc-600 mb-1 block">
                Valor Disponível em Conta (R$)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 5000.00"
                value={inputBalance}
                onChange={(e) => setInputBalance(e.target.value)}
                required
              />
              <p className="text-xs text-zinc-500 mt-1">
                Informe o valor total fictício ou real reservado em conta bancária para despesas do casamento.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Saldo"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CADASTRO / EDIÇÃO DE CARTÃO DE CRÉDITO */}
      <Dialog open={cardModalOpen} onOpenChange={setCardModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5 text-[#8C6D45]" />
              {editingCard ? "Editar Cartão de Crédito" : "Cadastrar Cartão de Crédito"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCard} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-zinc-600 mb-1 block">Banco / Emissor *</Label>
                <Select value={cardForm.bank} onValueChange={handleBankChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BANKS.map((b) => (
                      <SelectItem key={b.name} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-zinc-600 mb-1 block">Bandeira *</Label>
                <Select
                  value={cardForm.brand}
                  onValueChange={(val) => setCardForm({ ...cardForm, brand: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANDS.map((br) => (
                      <SelectItem key={br} value={br}>
                        {br}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-zinc-600 mb-1 block">
                  Apelido do Cartão (Opcional)
                </Label>
                <Input
                  placeholder="Ex: Cartão Noivo, Nubank Noiva"
                  value={cardForm.nickname}
                  onChange={(e) => setCardForm({ ...cardForm, nickname: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-zinc-600 mb-1 block">
                  Últimos 4 Dígitos (Opcional)
                </Label>
                <Input
                  placeholder="Ex: 1234"
                  maxLength={4}
                  value={cardForm.lastDigits}
                  onChange={(e) => setCardForm({ ...cardForm, lastDigits: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-600 mb-1 block">
                Limite Atual (R$) *
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 8000.00"
                value={cardForm.limit}
                onChange={(e) => setCardForm({ ...cardForm, limit: e.target.value })}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-600 mb-1 block">
                Cor Temática do Cartão
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cardForm.color}
                  onChange={(e) => setCardForm({ ...cardForm, color: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-200 p-0.5"
                />
                <span className="text-xs text-zinc-500 font-mono">{cardForm.color}</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#8C6D45] hover:bg-[#755630] text-white font-bold"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingCard ? (
                "Salvar Alterações"
              ) : (
                "Cadastrar Cartão"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          confirmDeleteCard();
        }}
        title="Excluir Cartão de Crédito"
        description="Tem certeza de que deseja excluir este cartão de crédito da carteira?"
      />
    </div>
  );
}
