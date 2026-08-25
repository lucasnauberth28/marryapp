"use client";

import { useState, useRef, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { createVendor, updateVendor, deleteVendor } from "@/actions/vendor-actions";
import { createVendorLead } from "@/actions/partner-vendor-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Link as LinkIcon,
  FileText,
  Upload,
  Building2,
  Compass,
  Star,
  MapPin,
  Video,
  CheckCircle2,
  MessageCircle,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface VendorsClientProps {
  initialVendors: any[];
  initialPartners?: any[];
}

export function VendorsClient({ initialVendors, initialPartners = [] }: VendorsClientProps) {
  const [activeTab, setActiveTab] = useState<"MY_VENDORS" | "MARKETPLACE">("MARKETPLACE");
  const [vendors, setVendors] = useState<any[]>(initialVendors);
  const [partners, setPartners] = useState<any[]>(initialPartners);
  
  // Filtros do Marketplace
  const [selectedRegion, setSelectedRegion] = useState("TODAS");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal de Lead / Reunião
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [coupleName, setCoupleName] = useState("");
  const [couplePhone, setCouplePhone] = useState("");
  const [coupleEmail, setCoupleEmail] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [meetingType, setMeetingType] = useState<"ONLINE" | "PRESENTIAL">("ONLINE");
  const [leadMessage, setLeadMessage] = useState("");
  const [isPendingLead, startTransitionLead] = useTransition();

  // Estados dos modais de fornecedores internos
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [contractMode, setContractMode] = useState<"file" | "url">("file");
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const [editContractMode, setEditContractMode] = useState<"file" | "url">("file");
  const [editFileBase64, setEditFileBase64] = useState<string>("");
  const [editFileName, setEditFileName] = useState<string>("");
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    contact: "",
    contractUrl: "",
    notes: "",
  });

  const regionsList = [
    { id: "TODAS", label: "Todas as Regiões" },
    { id: "São Paulo - Capital", label: "São Paulo - Capital" },
    { id: "Grande SP", label: "Grande SP" },
    { id: "Litoral Norte", label: "Litoral Norte" },
    { id: "Campinas e Região", label: "Campinas e Região" },
    { id: "Vale do Paraíba", label: "Vale do Paraíba" },
    { id: "Brasil Todo", label: "Atende Brasil Todo" },
  ];

  const categoriesList = ["TODOS", "Espaço", "Buffet", "Fotografia", "Decoração", "DJ & Som", "Doces & Bolo"];

  const filteredPartners = partners.filter((p) => {
    const matchesCategory = selectedCategory === "TODOS" || p.category === selectedCategory;
    let matchesRegion = selectedRegion === "TODAS";
    if (!matchesRegion) {
      try {
        const pRegions: string[] = JSON.parse(p.serviceRegions || "[]");
        matchesRegion = pRegions.includes(selectedRegion) || pRegions.includes("Brasil Todo");
      } catch {
        matchesRegion = true;
      }
    }
    const matchesSearch =
      !searchTerm ||
      p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesRegion && matchesSearch;
  });

  const handleOpenLeadModal = (partner: any) => {
    setSelectedPartner(partner);
    setLeadModalOpen(true);
  };

  const handleSendLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleName || !couplePhone) {
      toast.error("Preencha seu nome e WhatsApp.");
      return;
    }

    startTransitionLead(async () => {
      const res = await createVendorLead({
        vendorId: selectedPartner.id,
        coupleName,
        couplePhone,
        coupleEmail,
        guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
        meetingType,
        message: leadMessage,
      });

      if (res.success) {
        toast.success(`Solicitação enviada com sucesso para ${selectedPartner.companyName}! 📅`);
        setLeadModalOpen(false);
        setCoupleName("");
        setCouplePhone("");
        setCoupleEmail("");
        setLeadMessage("");
      } else {
        toast.error("Erro ao enviar solicitação.");
      }
    });
  };

  const resetForm = () => {
    setContractMode("file");
    setFileBase64("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (isEdit) {
        setEditFileBase64(res);
        setEditFileName(file.name);
      } else {
        setFileBase64(res);
        setFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (contractMode === "file" && fileBase64) {
      formData.set("contractUrl", fileBase64);
    }
    const res = await createVendor(formData);
    if (res.success) {
      resetForm();
      setOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || "Erro ao criar fornecedor.");
    }
    setLoading(false);
  };

  const handleEdit = (vendor: any) => {
    setEditingVendor(vendor);
    setEditForm({
      name: vendor.name,
      category: vendor.category,
      contact: vendor.contact || "",
      contractUrl: vendor.contractUrl || "",
      notes: vendor.notes || "",
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingVendor) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (editContractMode === "file" && editFileBase64) {
      formData.set("contractUrl", editFileBase64);
    }
    const res = await updateVendor(editingVendor.id, formData);
    if (res.success) {
      setEditOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || "Erro ao atualizar fornecedor.");
    }
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    setConfirmAction(() => async () => {
      const res = await deleteVendor(id);
      if (res.success) {
        setVendors((prev) => prev.filter((v) => v.id !== id));
        toast.success("Fornecedor excluído com sucesso!");
      } else {
        toast.error("Erro ao excluir fornecedor.");
      }
    });
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header com Navegação em Abas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#8C6D45] font-serif italic tracking-tight">
            Fornecedores & Parceiros Homologados
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Encontre empresas homologadas na sua região e gerencie os contratos do seu casamento.
          </p>
        </div>

        {/* Seletor de Abas */}
        <div className="inline-flex bg-stone-100 p-1 rounded-full border border-stone-200">
          <button
            onClick={() => setActiveTab("MARKETPLACE")}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "MARKETPLACE"
                ? "bg-white text-[#8C6D45] shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            🌟 Marketplace de Parceiros ({partners.length})
          </button>
          <button
            onClick={() => setActiveTab("MY_VENDORS")}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "MY_VENDORS"
                ? "bg-white text-[#8C6D45] shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            📋 Meus Contratos ({vendors.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ABA MARKETPLACE DE FORNECEDORES HOMOLOGADOS */}
      {/* ========================================================================= */}
      {activeTab === "MARKETPLACE" && (
        <div className="space-y-6">
          {/* Barra de Filtros por Região e Categoria */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Campo de Busca */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar fornecedor ou serviço..."
                  className="pl-10 bg-stone-50/60 border-stone-200 rounded-2xl h-11 text-xs"
                />
              </div>

              {/* Seletor de Regiões */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
                {regionsList.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRegion(r.id)}
                    className={`px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedRegion === r.id
                        ? "bg-[#8C6D45] text-white shadow-xs"
                        : "bg-stone-100/80 text-stone-600 hover:bg-stone-200/70"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categorias */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-stone-100 pb-1">
              {categoriesList.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === c
                      ? "bg-stone-900 text-white shadow-xs"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Fornecedores Parceiros */}
          {filteredPartners.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 text-stone-400 text-sm">
              <Compass className="w-10 h-10 mx-auto mb-2 opacity-50 text-[#8C6D45]" />
              <p className="font-bold text-stone-700">Nenhum fornecedor encontrado nesta região.</p>
              <p className="text-xs text-stone-500 mt-1">Tente selecionar outra categoria ou região de atendimento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPartners.map((partner) => {
                let regions: string[] = [];
                try {
                  regions = JSON.parse(partner.serviceRegions || "[]");
                } catch {
                  regions = ["São Paulo"];
                }

                return (
                  <div
                    key={partner.id}
                    className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    {/* Imagem de Capa */}
                    <div className="h-48 relative overflow-hidden bg-stone-100">
                      {partner.coverUrl ? (
                        <img
                          src={partner.coverUrl}
                          alt={partner.companyName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                          <Building2 className="w-8 h-8" />
                        </div>
                      )}

                      {/* Badges de Destaque */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {partner.isVerified && (
                          <Badge className="bg-emerald-600/90 text-white font-bold text-[10px] backdrop-blur-md gap-1">
                            <ShieldCheck className="w-3 h-3" /> Verificado
                          </Badge>
                        )}
                        <Badge className="bg-stone-900/80 text-white font-bold text-[10px] backdrop-blur-md">
                          {partner.category}
                        </Badge>
                      </div>

                      {/* Avaliação */}
                      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-stone-900 flex items-center gap-1 shadow-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{partner.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-stone-400">({partner.reviewCount})</span>
                      </div>
                    </div>

                    {/* Informações Comerciais */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-serif font-bold text-xl text-stone-900 line-clamp-1">
                          {partner.companyName}
                        </h3>
                        <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                          {partner.description}
                        </p>
                      </div>

                      {/* Regiões de Atendimento */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Regiões de Atendimento / Entrega:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {regions.map((r, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#FAF4ED] text-[#8C6D45] px-2 py-0.5 rounded-md border border-[#8C6D45]/20"
                            >
                              <MapPin className="w-2.5 h-2.5" />
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Modalidades de Reunião */}
                      <div className="flex items-center gap-3 pt-2 border-t border-stone-100 text-xs text-stone-600 font-semibold">
                        {partner.offersOnlineMeet && (
                          <span className="flex items-center gap-1 text-emerald-700">
                            <Video className="w-3.5 h-3.5" /> Reunião Online
                          </span>
                        )}
                        {partner.hasPhysicalSpace && (
                          <span className="flex items-center gap-1 text-blue-700">
                            <MapPin className="w-3.5 h-3.5" /> Showroom Presencial
                          </span>
                        )}
                      </div>

                      {/* Rodapé do Card com Valores e Ações */}
                      <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">
                            Investimento médio:
                          </span>
                          <span className="text-base font-extrabold text-stone-900">
                            {partner.startingPrice
                              ? `A partir de ${new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(partner.startingPrice / 100)}`
                              : "Sob consulta"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {partner.whatsapp && (
                            <a
                              href={`https://wa.me/55${partner.whatsapp.replace(/\D/g, "")}?text=Olá,%20encontrei%20sua%20empresa%20no%20MarryApp!`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                size="icon"
                                variant="outline"
                                className="rounded-full w-10 h-10 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                                title="Chamar no WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            </a>
                          )}

                          <Button
                            onClick={() => handleOpenLeadModal(partner)}
                            className="bg-[#8C6D45] hover:bg-[#785c39] text-white text-xs font-bold rounded-full h-10 px-4 gap-1.5 shadow-xs"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Agendar Reunião</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ABA MEUS CONTRATOS INTERNOS */}
      {/* ========================================================================= */}
      {activeTab === "MY_VENDORS" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#8C6D45] hover:bg-[#755630] text-white gap-2 rounded-full font-bold text-xs h-11 px-5">
                  <Plus className="w-4 h-4" /> Novo Contrato de Fornecedor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="font-serif italic font-bold text-xl text-[#8C6D45]">
                    Adicionar Fornecedor Contratado
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                  <div>
                    <Label className="text-xs font-semibold text-zinc-600 mb-1 block">Nome do Fornecedor / Empresa</Label>
                    <Input name="name" placeholder="Ex: Buffet Flor de Sal" required className="rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-600 mb-1 block">Categoria</Label>
                    <Input name="category" placeholder="Ex: Buffet, Fotografia, Decoração" required className="rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-600 mb-1 block">Contato (Telefone / WhatsApp / E-mail)</Label>
                    <Input name="contact" placeholder="(11) 99999-9999" className="rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full bg-[#8C6D45] hover:bg-[#755630] text-white rounded-full font-bold h-11" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Fornecedor"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabela de Contratos */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6">
            <div className="divide-y divide-stone-100">
              {vendors.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-sm">
                  Nenhum contrato cadastrado ainda.
                </div>
              ) : (
                vendors.map((v) => (
                  <div key={v.id} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#8C6D45]">{v.category}</span>
                      <h4 className="font-bold text-base text-stone-900 font-serif">{v.name}</h4>
                      <p className="text-xs text-stone-500">{v.contact || "Sem contato informado"}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(v)}
                        className="text-stone-400 hover:text-stone-700 rounded-full h-9 w-9"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(v.id)}
                        className="text-stone-400 hover:text-red-600 rounded-full h-9 w-9"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE SOLICITAÇÃO DE REUNIÃO / LEAD PARA O FORNECEDOR */}
      {/* ========================================================================= */}
      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <DialogContent className="max-w-lg bg-white rounded-3xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="font-serif italic font-bold text-2xl text-stone-900">
              Agendar Reunião / Orçamento
            </DialogTitle>
            <p className="text-xs text-stone-500">
              Solicitando contato com: <span className="font-bold text-stone-900">{selectedPartner?.companyName}</span>
            </p>
          </DialogHeader>

          <form onSubmit={handleSendLead} className="space-y-4 pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-stone-600 uppercase">Seu Nome / Nome dos Noivos</Label>
                <Input
                  value={coupleName}
                  onChange={(e) => setCoupleName(e.target.value)}
                  placeholder="Lucas & Giovanna"
                  required
                  className="rounded-2xl h-11"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-stone-600 uppercase">Seu WhatsApp</Label>
                <Input
                  value={couplePhone}
                  onChange={(e) => setCouplePhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                  className="rounded-2xl h-11 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-stone-600 uppercase">E-mail para Retorno</Label>
                <Input
                  type="email"
                  value={coupleEmail}
                  onChange={(e) => setCoupleEmail(e.target.value)}
                  placeholder="contato@noivos.com"
                  className="rounded-2xl h-11"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-stone-600 uppercase">Estimativa de Convidados</Label>
                <Input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="Ex: 150"
                  className="rounded-2xl h-11"
                />
              </div>
            </div>

            {/* Modalidade de Reunião */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-600 uppercase">Modalidade Preferida de Reunião</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMeetingType("ONLINE")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    meetingType === "ONLINE"
                      ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                      : "bg-stone-50 border-stone-200 text-stone-600"
                  }`}
                >
                  <Video className="w-4 h-4 text-emerald-600" />
                  <span>Online (Meet/Zoom)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingType("PRESENTIAL")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    meetingType === "PRESENTIAL"
                      ? "bg-blue-50 border-blue-600 text-blue-800"
                      : "bg-stone-50 border-stone-200 text-stone-600"
                  }`}
                >
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Presencial no Ateliê</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-stone-600 uppercase">Mensagem ou Dúvidas</Label>
              <Textarea
                value={leadMessage}
                onChange={(e) => setLeadMessage(e.target.value)}
                placeholder="Olá, gostaríamos de consultar a disponibilidade para a nossa data e agendar uma reunião..."
                rows={3}
                className="rounded-2xl"
              />
            </div>

            <Button
              type="submit"
              disabled={isPendingLead}
              className="w-full bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold text-xs h-12 gap-2 shadow-sm"
            >
              {isPendingLead ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              <span>Solicitar Agendamento com Fornecedor</span>
            </Button>
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
        title="Excluir Fornecedor"
        description="Tem certeza de que deseja excluir este fornecedor?"
      />
    </div>
  );
}
