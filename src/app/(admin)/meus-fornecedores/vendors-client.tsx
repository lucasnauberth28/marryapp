"use client";
import { useRouter } from "next/navigation";
import { useSyncedState } from "@/hooks/use-synced-state";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { createVendor, updateVendor, deleteVendor, type getVendors } from "@/actions/vendor-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/page-header";
import { btn } from "@/components/landing/styles";
import { Chip, card } from "@/components/casal/ui";

type WeddingVendor = Awaited<ReturnType<typeof getVendors>>[number];

interface VendorsClientProps {
  initialVendors: WeddingVendor[];
}

/** Categorias comuns de casamento (as mesmas da vitrine) para lembrar o que ainda falta escolher. */
const COMMON_CATEGORIES = ["Espaço", "Buffet", "Fotografia", "Decoração", "DJ & Som", "Doces & Bolo", "Vestidos"];

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (cents: number) => brl.format(cents / 100).replace(/,00$/, "").replace(/ /g, " ");
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

interface VendorForm {
  name: string;
  category: string;
  contact: string;
  notes: string;
  contractUrl: string;
}
const EMPTY_FORM: VendorForm = { name: "", category: "", contact: "", notes: "", contractUrl: "" };

/** Resumo do dinheiro do fornecedor a partir das despesas ligadas a ele. */
function paymentSummary(v: WeddingVendor) {
  const list = v.expenses ?? [];
  if (list.length === 0) return "Sem despesas lançadas";
  const total = list.reduce((acc, e) => acc + e.amount, 0);
  const paid = list.filter((e) => e.status === "PAID").length;
  if (paid === list.length) return `${money(total)} · pago`;
  if (list.length === 1) return `${money(total)} · a pagar`;
  return `${money(total)} · ${paid} de ${list.length} parcelas pagas`;
}

export function VendorsClient({ initialVendors }: VendorsClientProps) {
  const router = useRouter();
  const uid = useId();
  const [vendors, setVendors] = useSyncedState<WeddingVendor[]>(initialVendors);

  const [formOpen, setFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<WeddingVendor | null>(null);
  const [form, setForm] = useState<VendorForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileBase64, setFileBase64] = useState("");
  const [fileName, setFileName] = useState("");

  const hiredCategories = vendors.map((v) => norm(v.category));
  const missing = COMMON_CATEGORIES.filter((c) => !hiredCategories.some((h) => h === norm(c) || h.includes(norm(c))));

  const resetFile = () => {
    setFileBase64("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => {
    setEditingVendor(null);
    setForm(EMPTY_FORM);
    resetFile();
    setFormOpen(true);
  };

  const openEdit = (vendor: WeddingVendor) => {
    setEditingVendor(vendor);
    setForm({
      name: vendor.name,
      category: vendor.category,
      contact: vendor.contact || "",
      notes: vendor.notes || "",
      contractUrl: vendor.contractUrl && vendor.contractUrl.startsWith("https://") ? vendor.contractUrl : "",
    });
    resetFile();
    setFormOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileBase64(event.target?.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(editingVendor ? "Salvando as mudanças..." : "Adicionando o fornecedor...");
    const formData = new FormData();
    formData.set("name", form.name);
    formData.set("category", form.category);
    formData.set("contact", form.contact);
    formData.set("notes", form.notes);
    // Arquivo novo vale mais que o link; sem nenhum dos dois, mantém o contrato que já estava salvo
    const contract = fileBase64 || form.contractUrl || (editingVendor?.contractUrl ?? "");
    if (contract) formData.set("contractUrl", contract);

    const res = editingVendor ? await updateVendor(editingVendor.id, formData) : await createVendor(formData);
    if (res.success) {
      toast.success(editingVendor ? "Fornecedor atualizado." : "Fornecedor adicionado.", { id: toastId });
      setFormOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Não foi possível salvar o fornecedor.", { id: toastId });
    }
    setLoading(false);
  };

  const handleDelete = (v: WeddingVendor) => {
    setConfirmAction(() => async () => {
      const toastId = toast.loading("Removendo o fornecedor...");
      const res = await deleteVendor(v.id);
      if (res.success) {
        setVendors((prev) => prev.filter((x) => x.id !== v.id));
        toast.success("Fornecedor removido.", { id: toastId });
      } else {
        toast.error(res.error || "Não foi possível remover o fornecedor.", { id: toastId });
      }
    });
    setConfirmOpen(true);
  };

  const labelCls = "mb-1 block text-sm font-semibold text-tinta";
  const inputCls = "min-h-11 rounded-xl sm:min-h-10";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Organização"
        title="Meus fornecedores"
        description={vendors.length === 0 ? "Registrem aqui quem vocês contrataram." : `${vendors.length} ${vendors.length === 1 ? "contratado" : "contratados"}`}
        actions={
          <>
            <Link href="/fornecedores" className={btn.secondary}>
              Encontrar na vitrine
            </Link>
            <button type="button" onClick={openCreate} className={btn.primary}>
              <Plus className="size-4" aria-hidden="true" /> Adicionar fornecedor
            </button>
          </>
        }
      />

      <div className="grid items-start gap-4 md:grid-cols-2">
        {/* Contratados */}
        <section aria-labelledby="contratados-titulo" className="flex flex-col gap-2 rounded-2xl bg-areia p-3">
          <h2 id="contratados-titulo" className="mx-2 mb-1 mt-1 flex justify-between text-sm font-semibold text-tinta">
            Contratados <span className="text-tinta-suave">{vendors.length}</span>
          </h2>
          {vendors.length === 0 ? (
            <div className={`${card} flex flex-col items-start gap-3 p-4`}>
              <p className="text-[15px] text-tinta-suave">Ainda não há fornecedores aqui. Adicionem o primeiro para acompanhar contato e pagamentos.</p>
              <button type="button" onClick={openCreate} className={`${btn.primary} ${btn.sm}`}>
                <Plus className="size-4" aria-hidden="true" /> Adicionar fornecedor
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {vendors.map((v) => (
                <li key={v.id} className={`${card} flex flex-col gap-1.5 p-3.5`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col items-start gap-1.5">
                      <Chip tone="salvia" className="min-h-6 text-[13px]">{v.category}</Chip>
                      <strong className="font-semibold text-tinta">{v.name}</strong>
                    </div>
                    <div className="-mr-2 -mt-1 flex shrink-0">
                      <button
                        type="button"
                        aria-label={`Editar ${v.name}`}
                        onClick={() => openEdit(v)}
                        className={`${btn.quiet} !min-w-11 !px-0`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remover ${v.name}`}
                        onClick={() => handleDelete(v)}
                        className={`${btn.quiet} !min-w-11 !px-0 text-perigo hover:bg-perigo-suave`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <span className="text-sm text-tinta-suave">{paymentSummary(v)}</span>
                  {v.contact && <span className="text-sm text-tinta-suave">{v.contact}</span>}
                  {v.contractUrl && (
                    <Chip tone="sucesso" icon={Check}>
                      Contrato anexado
                    </Chip>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Ainda falta escolher */}
        <section aria-labelledby="falta-titulo" className="flex flex-col gap-2 rounded-2xl bg-areia p-3">
          <h2 id="falta-titulo" className="mx-2 mb-1 mt-1 flex justify-between text-sm font-semibold text-tinta">
            Ainda falta escolher <span className="text-tinta-suave">{missing.length}</span>
          </h2>
          {missing.length === 0 ? (
            <p className={`${card} p-4 text-[15px] text-tinta-suave`}>Vocês já têm fornecedor em todas as categorias mais comuns.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {missing.map((c) => (
                <li key={c}>
                  <Link href="/fornecedores" className={`${card} flex min-h-12 items-center justify-between p-3.5 text-tinta no-underline hover:border-ameixa`}>
                    <span>{c}</span>
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl bg-papel">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-normal text-tinta">
              {editingVendor ? "Editar fornecedor" : "Adicionar fornecedor"}
            </DialogTitle>
            <DialogDescription>Quem vocês contrataram e como falar com a pessoa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <Label htmlFor={`${uid}-name`} className={labelCls}>Nome do fornecedor ou da empresa</Label>
              <Input id={`${uid}-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Buffet Flor de Sal" required className={inputCls} />
            </div>
            <div>
              <Label htmlFor={`${uid}-category`} className={labelCls}>Categoria</Label>
              <Input
                id={`${uid}-category`}
                list={`${uid}-categories`}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex.: Buffet, Fotografia, Decoração"
                required
                className={inputCls}
              />
              <datalist id={`${uid}-categories`}>
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor={`${uid}-contact`} className={labelCls}>
                Contato <span className="font-normal text-tinta-suave">(telefone, WhatsApp ou e-mail)</span>
              </Label>
              <Input id={`${uid}-contact`} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="(11) 99999-9999" className={inputCls} />
            </div>
            <div>
              <Label htmlFor={`${uid}-notes`} className={labelCls}>
                Anotações <span className="font-normal text-tinta-suave">(opcional)</span>
              </Label>
              <Textarea id={`${uid}-notes`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor={`${uid}-contract`} className={labelCls}>
                Contrato <span className="font-normal text-tinta-suave">(opcional, até 8 MB)</span>
              </Label>
              <input
                id={`${uid}-contract`}
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="block min-h-11 w-full cursor-pointer rounded-xl border border-linha-forte bg-papel p-2 text-sm text-tinta file:mr-3 file:rounded-lg file:border-0 file:bg-ameixa-suave file:px-3 file:py-1.5 file:font-semibold file:text-ameixa"
              />
              {fileName && <p className="mt-1 text-sm text-tinta-suave">Arquivo escolhido: {fileName}</p>}
              {editingVendor?.contractUrl && !fileName && <p className="mt-1 text-sm text-tinta-suave">Já há um contrato anexado. Escolher outro arquivo troca o atual.</p>}
            </div>
            <button type="submit" className={`${btn.primary} ${btn.block}`} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : editingVendor ? "Salvar mudanças" : "Adicionar fornecedor"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          confirmAction?.();
        }}
        title="Remover fornecedor"
        description="Tem certeza de que deseja remover este fornecedor da lista?"
      />
    </div>
  );
}
