"use client";
import { useRouter } from "next/navigation";
import { useSyncedState } from "@/hooks/use-synced-state";

import { useState } from "react";
import type { CreditCard } from "@prisma/client";
import { toast } from "sonner";
import { updateWalletBalance, createCreditCard, updateCreditCard, deleteCreditCard } from "@/actions/wallet-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/admin/page-header";
import { btn } from "@/components/landing/styles";
import { Chip, bigNumber, card as cardClass, cardTitle, overline } from "@/components/casal/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, CreditCard as CreditCardIcon, Loader2, Lock, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";

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
  initialCards: CreditCard[];
  /** Soma das despesas ainda não pagas, em centavos. */
  toPayCents: number;
}

export function CarteiraClient({ initialBalance, initialCards, toPayCents }: CarteiraClientProps) {
  const router = useRouter();
  const [balance, setBalance] = useSyncedState<number>(initialBalance);
  const [cards, setCards] = useSyncedState<CreditCard[]>(initialCards);

  const [loading, setLoading] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

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
    return (valInCents / 100)
      .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      .replace(/,00$/, "")
      .replace(/\u00a0/g, " ");
  };

  const totalCardLimit = cards.reduce((sum, c) => sum + (c.limit || 0), 0);
  const totalAssets = balance + totalCardLimit;

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Atualizando o saldo...");
    const cents = Math.round(parseFloat(inputBalance.replace(",", ".")) * 100);

    const res = await updateWalletBalance(cents);
    if (res.success) {
      setBalance(cents);
      setBalanceModalOpen(false);
      toast.success("Saldo atualizado.", { id: toastId });
    } else {
      toast.error(res.error || "Erro ao atualizar saldo.", { id: toastId });
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

  const openEditCardModal = (card: CreditCard) => {
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
    const toastId = toast.loading(editingCard ? "Atualizando cartão..." : "Salvando o cartão...");

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
        toast.success("Cartão atualizado.", { id: toastId });
      } else {
        toast.error(res.error || "Erro ao atualizar cartão.", { id: toastId });
      }
    } else {
      const res = await createCreditCard(formData);
      if (res.success) {
        toast.success("Cartão cadastrado.", { id: toastId });
        setCardModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Erro ao cadastrar cartão.", { id: toastId });
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
    const toastId = toast.loading("Excluindo cartão...");
    const res = await deleteCreditCard(cardToDelete);
    if (res.success) {
      setCards(cards.filter((c) => c.id !== cardToDelete));
      toast.success("Cartão excluído.", { id: toastId });
    } else {
      toast.error(res.error || "Erro ao excluir cartão.", { id: toastId });
    }
    setCardToDelete(null);
  };

  const fits = toPayCents <= totalAssets;
  const inputCls = "min-h-11 sm:min-h-10";
  const labelCls = "mb-1 block text-sm font-semibold text-tinta";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Organização"
        title="Carteira"
        description="Quanto vocês têm para pagar o casamento: saldo em conta e limite dos cartões. Só vocês veem."
        actions={
          <button type="button" onClick={openNewCardModal} className={btn.primary}>
            <Plus className="size-4" aria-hidden="true" /> Adicionar cartão
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        <article className="flex flex-col gap-2 rounded-2xl bg-ameixa p-5 text-on-ameixa shadow-[var(--shadow-aceito-2)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.08em]">Para gastar</p>
          <span className="font-display text-[40px] leading-[44px] tabular-nums md:text-[44px] md:leading-[48px]">{formatCurrency(totalAssets)}</span>
          <span className="text-sm">Saldo em conta somado ao limite dos cartões</span>
        </article>

        <article className={`${cardClass} flex flex-col gap-2 p-5 sm:p-6`}>
          <p className={overline}>Saldo em conta e Pix</p>
          <span className={bigNumber}>{formatCurrency(balance)}</span>
          <button type="button" onClick={() => setBalanceModalOpen(true)} className={`${btn.quiet} ${btn.sm} self-start`}>
            <Pencil className="size-4" aria-hidden="true" /> Atualizar saldo
          </button>
        </article>

        <article className={`${cardClass} flex flex-col gap-2 p-5 sm:p-6`}>
          <p className={overline}>Falta pagar</p>
          <span className={bigNumber}>{formatCurrency(toPayCents)}</span>
          {toPayCents === 0 ? (
            <span className="text-sm text-tinta-suave">Nenhuma despesa em aberto.</span>
          ) : fits ? (
            <Chip tone="sucesso" icon={Check}>Cabe na carteira</Chip>
          ) : (
            <Chip tone="aviso" icon={TriangleAlert}>Faltam {formatCurrency(toPayCents - totalAssets)}</Chip>
          )}
        </article>
      </div>

      <section aria-labelledby="cartoes-titulo" className="flex flex-col gap-3">
        <h2 id="cartoes-titulo" className={cardTitle}>Cartões de crédito</h2>

        {cards.length === 0 ? (
          <div className={`${cardClass} flex flex-col items-center gap-3 px-4 py-12 text-center`}>
            <CreditCardIcon className="size-10 text-linha-forte" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-tinta">Nenhum cartão cadastrado</h3>
              <p className="mt-1 text-sm text-tinta-suave">
                Cadastrem os cartões para saber de onde sai cada parcela ou compra.
              </p>
            </div>
            <button type="button" onClick={openNewCardModal} className={`${btn.primary} mt-1`}>
              <Plus className="size-4" aria-hidden="true" /> Adicionar o primeiro cartão
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {cards.map((card) => {
              const name = card.nickname || card.bank;
              return (
                <li key={card.id} className={`${cardClass} flex items-center gap-3 p-5`}>
                  <span
                    style={{ background: card.color || "#231C24" }}
                    className="grid h-[30px] w-11 shrink-0 place-items-center rounded-md text-linho"
                    aria-hidden="true"
                  >
                    <CreditCardIcon className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate font-semibold text-tinta">{name}</strong>
                    <span className="text-sm text-tinta-suave">
                      {card.nickname ? `${card.bank} · ` : ""}
                      {card.brand}
                      {card.lastDigits ? ` · final ${card.lastDigits}` : ""}
                    </span>
                    <span className="text-sm text-tinta-suave">
                      Limite <span className="font-semibold text-tinta">{formatCurrency(card.limit)}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Editar ${name}`}
                    onClick={() => openEditCardModal(card)}
                    className={`${btn.quiet} !min-w-11 !px-0`}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Excluir ${name}`}
                    onClick={() => handleDeleteCard(card.id)}
                    className={`${btn.quiet} !min-w-11 !px-0 text-perigo hover:bg-perigo-suave`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="flex gap-2 text-sm text-tinta-suave">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Aqui vocês registram só o apelido, o final e o limite. Nenhum dado do cartão é guardado.
        </p>
      </section>

      {/* Editar o saldo em conta */}
      <Dialog open={balanceModalOpen} onOpenChange={setBalanceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar saldo em conta e Pix</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateBalance} className="mt-2 space-y-4">
            <div>
              <Label htmlFor="carteira-saldo" className={labelCls}>
                Quanto vocês têm em conta (R$)
              </Label>
              <Input
                id="carteira-saldo"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="Ex.: 5000,00"
                value={inputBalance}
                onChange={(e) => setInputBalance(e.target.value)}
                required
                className={inputCls}
              />
              <p className="mt-1 text-sm text-tinta-suave">
                O valor reservado para as despesas do casamento. Vocês atualizam quando mudar.
              </p>
            </div>

            <button type="submit" className={`${btn.primary} ${btn.block}`} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : "Salvar saldo"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cadastrar ou editar cartão */}
      <Dialog open={cardModalOpen} onOpenChange={setCardModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCard ? "Editar cartão" : "Adicionar cartão"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCard} className="mt-2 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="cartao-banco" className={labelCls}>Banco</Label>
                <Select value={cardForm.bank} onValueChange={handleBankChange}>
                  <SelectTrigger id="cartao-banco" className="w-full">
                    <SelectValue placeholder="Escolha" />
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
                <Label htmlFor="cartao-bandeira" className={labelCls}>Bandeira</Label>
                <Select
                  value={cardForm.brand}
                  onValueChange={(val) => setCardForm({ ...cardForm, brand: val })}
                >
                  <SelectTrigger id="cartao-bandeira" className="w-full">
                    <SelectValue placeholder="Escolha" />
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="cartao-apelido" className={labelCls}>
                  Apelido <span className="font-normal text-tinta-suave">(opcional)</span>
                </Label>
                <Input
                  id="cartao-apelido"
                  placeholder="Ex.: Cartão da Ana"
                  value={cardForm.nickname}
                  onChange={(e) => setCardForm({ ...cardForm, nickname: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <Label htmlFor="cartao-final" className={labelCls}>
                  Final do cartão <span className="font-normal text-tinta-suave">(opcional)</span>
                </Label>
                <Input
                  id="cartao-final"
                  placeholder="Ex.: 1234"
                  inputMode="numeric"
                  maxLength={4}
                  value={cardForm.lastDigits}
                  onChange={(e) => setCardForm({ ...cardForm, lastDigits: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cartao-limite" className={labelCls}>Limite (R$)</Label>
              <Input
                id="cartao-limite"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="Ex.: 8000,00"
                value={cardForm.limit}
                onChange={(e) => setCardForm({ ...cardForm, limit: e.target.value })}
                required
                className={inputCls}
              />
            </div>

            <div>
              <Label htmlFor="cartao-cor" className={labelCls}>Cor do cartão na lista</Label>
              <div className="flex items-center gap-3">
                <input
                  id="cartao-cor"
                  type="color"
                  value={cardForm.color}
                  onChange={(e) => setCardForm({ ...cardForm, color: e.target.value })}
                  className="size-11 cursor-pointer rounded-lg border border-linha-forte p-0.5"
                />
                <span className="font-mono text-sm text-tinta-suave">{cardForm.color}</span>
              </div>
            </div>

            <button type="submit" className={`${btn.primary} ${btn.block}`} disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : editingCard ? (
                "Salvar alterações"
              ) : (
                "Adicionar cartão"
              )}
            </button>
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
        title="Excluir cartão"
        description="Tem certeza de que deseja excluir este cartão da carteira?"
      />
    </div>
  );
}
