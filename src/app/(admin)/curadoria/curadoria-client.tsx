"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  ExternalLink,
  MapPin,
  Camera,
  Star,
  FileText,
  DollarSign,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  approveVendorAction,
  rejectVendorAction,
  getAllVendorsForCurationAction,
} from "@/actions/partner-vendor-actions";
import { toast } from "sonner";

interface CuradoriaClientProps {
  initialVendors: any[];
  initialCounts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export function CuradoriaClient({
  initialVendors,
  initialCounts,
}: CuradoriaClientProps) {
  const [vendors, setVendors] = useState<any[]>(initialVendors);
  const [counts, setCounts] = useState(initialCounts);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED">(
    "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [vendorToReject, setVendorToReject] = useState<any | null>(null);

  const [isPending, startTransition] = useTransition();

  const filteredVendors = vendors.filter((v) => {
    const matchesTab = activeTab === "ALL" || v.curationStatus === activeTab;
    const matchesSearch =
      v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.documentNumber && v.documentNumber.includes(searchQuery));
    return matchesTab && matchesSearch;
  });

  const handleApprove = (vendor: any) => {
    const toastId = toast.loading(`Aprovando e homologando ${vendor.companyName}...`);
    startTransition(async () => {
      const res = await approveVendorAction(vendor.id);
      if (res.success) {
        toast.success(`Fornecedor ${vendor.companyName} aprovado e publicado no marketplace! ✨`, {
          id: toastId,
        });
        setVendors((prev) =>
          prev.map((v) =>
            v.id === vendor.id
              ? { ...v, curationStatus: "APPROVED", isVerified: true }
              : v
          )
        );
        setCounts((c) => ({
          ...c,
          pending: Math.max(0, c.pending - 1),
          approved: c.approved + 1,
        }));
        if (selectedVendor?.id === vendor.id) {
          setSelectedVendor({ ...selectedVendor, curationStatus: "APPROVED", isVerified: true });
        }
      } else {
        toast.error(res.error || "Erro ao aprovar fornecedor.", { id: toastId });
      }
    });
  };

  const handleOpenReject = (vendor: any) => {
    setVendorToReject(vendor);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!vendorToReject) return;

    const toastId = toast.loading(`Registrando recusa de ${vendorToReject.companyName}...`);
    startTransition(async () => {
      const res = await rejectVendorAction(vendorToReject.id, rejectReason);
      if (res.success) {
        toast.success(`Cadastro de ${vendorToReject.companyName} recusado. Justificativa registrada.`, {
          id: toastId,
        });
        setVendors((prev) =>
          prev.map((v) =>
            v.id === vendorToReject.id
              ? { ...v, curationStatus: "REJECTED", isVerified: false, curationNotes: rejectReason }
              : v
          )
        );
        setCounts((c) => ({
          ...c,
          pending: Math.max(0, c.pending - 1),
          rejected: c.rejected + 1,
        }));
        setIsRejectModalOpen(false);
        setVendorToReject(null);
        if (selectedVendor?.id === vendorToReject.id) {
          setSelectedVendor(null);
        }
      } else {
        toast.error(res.error || "Erro ao recusar fornecedor.", { id: toastId });
      }
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#FAF4ED] text-[#8C6D45] p-2 rounded-xl border border-[#8C6D45]/30">
              <ShieldCheck className="w-5 h-5 text-[#8C6D45]" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900">
              Curadoria & Auditoria de Fornecedores
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Valide a legitimidade documental, portfólio e contatos antes da publicação no marketplace.
          </p>
        </div>

        <Link href="/fornecedores" target="_blank">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-bold gap-1.5 h-10 border-stone-300 hover:bg-stone-50"
          >
            <span>Ver Marketplace Público</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Cards de Métricas com Micro-interações */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab("PENDING_APPROVAL")}
          className={`p-6 rounded-3xl border transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 ${
            activeTab === "PENDING_APPROVAL"
              ? "bg-amber-50/80 border-amber-300 shadow-md ring-2 ring-amber-400/20"
              : "bg-white border-stone-200 hover:border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Pendentes de Auditoria
            </span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-black font-serif text-amber-900 mt-2">
            {counts.pending}
          </p>
          <p className="text-[11px] text-amber-700 mt-1">
            Aguardando validação de CNPJ e fotos
          </p>
        </div>

        <div
          onClick={() => setActiveTab("APPROVED")}
          className={`p-6 rounded-3xl border transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 ${
            activeTab === "APPROVED"
              ? "bg-emerald-50/80 border-emerald-300 shadow-md ring-2 ring-emerald-400/20"
              : "bg-white border-stone-200 hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Homologados & Ativos
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black font-serif text-emerald-900 mt-2">
            {counts.approved}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">
            Listados e disponíveis para os casais
          </p>
        </div>

        <div
          onClick={() => setActiveTab("REJECTED")}
          className={`p-6 rounded-3xl border transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 ${
            activeTab === "REJECTED"
              ? "bg-red-50/80 border-red-300 shadow-md ring-2 ring-red-400/20"
              : "bg-white border-stone-200 hover:border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-800">
              Recusados / Em Revisão
            </span>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-black font-serif text-red-900 mt-2">
            {counts.rejected}
          </p>
          <p className="text-[11px] text-red-700 mt-1">
            Documentação recusada por inconformidade
          </p>
        </div>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-[#FAF4ED] text-[#8C6D45] border border-[#8C6D45]/30 shadow-xs"
                : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            Todos ({counts.total})
          </button>
          <button
            onClick={() => setActiveTab("PENDING_APPROVAL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PENDING_APPROVAL"
                ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            Pendentes ({counts.pending})
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "APPROVED"
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs"
                : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            Aprovados ({counts.approved})
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "REJECTED"
                ? "bg-red-100 text-red-900 border border-red-300 shadow-xs"
                : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            Recusados ({counts.rejected})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar empresa, CNPJ..."
            className="pl-9 h-10 text-xs rounded-xl bg-stone-50 border-stone-200"
          />
        </div>
      </div>

      {/* Lista de Fornecedores para Curadoria */}
      <div className="space-y-4">
        {filteredVendors.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
            <ShieldCheck className="w-10 h-10 mx-auto text-stone-300" />
            <p className="text-sm font-bold text-stone-700">
              Nenhum fornecedor encontrado nesta categoria de curadoria.
            </p>
            <p className="text-xs text-stone-400">
              Novos cadastros realizados em /assinar aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          filteredVendors.map((vendor) => {
            let gallery: string[] = [];
            try {
              gallery = JSON.parse(vendor.galleryImages || "[]");
            } catch {
              gallery = [];
            }

            return (
              <div
                key={vendor.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-200 hover:shadow-md hover:border-stone-300"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Logo do Fornecedor */}
                  <div className="w-16 h-16 rounded-2xl bg-[#FAF4ED] border border-[#8C6D45]/30 overflow-hidden shrink-0 flex items-center justify-center">
                    {vendor.logoUrl ? (
                      <img
                        src={vendor.logoUrl}
                        alt={vendor.companyName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-[#8C6D45]" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold font-serif text-stone-900">
                        {vendor.companyName}
                      </h2>

                      {vendor.curationStatus === "PENDING_APPROVAL" && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pendente de Auditoria</span>
                        </span>
                      )}
                      {vendor.curationStatus === "APPROVED" && (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Homologado no Marketplace</span>
                        </span>
                      )}
                      {vendor.curationStatus === "REJECTED" && (
                        <span className="bg-red-100 text-red-900 border border-red-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span>Recusado</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                      <span className="font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md">
                        {vendor.category}
                      </span>
                      {vendor.documentNumber && (
                        <span className="font-mono bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">
                          {vendor.documentType || "CNPJ"}: {vendor.documentNumber}
                        </span>
                      )}
                      {vendor.priceRange && (
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                          Faixa: {vendor.priceRange}
                        </span>
                      )}
                      {gallery.length > 0 && (
                        <span className="flex items-center gap-1 text-stone-400">
                          <Camera className="w-3.5 h-3.5" />
                          <span>{gallery.length} fotos</span>
                        </span>
                      )}
                    </div>

                    {vendor.curationNotes && vendor.curationStatus === "REJECTED" && (
                      <p className="text-[11px] text-red-600 italic">
                        Motivo: {vendor.curationNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ações de Curadoria */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVendor(vendor)}
                    className="rounded-full text-xs font-bold h-10 px-4 border-stone-300 gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspecionar Dossiê</span>
                  </Button>

                  {vendor.curationStatus !== "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(vendor)}
                      disabled={isPending}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-bold h-10 px-4 gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aprovar</span>
                    </Button>
                  )}

                  {vendor.curationStatus !== "REJECTED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenReject(vendor)}
                      disabled={isPending}
                      className="text-red-700 hover:bg-red-50 rounded-full text-xs font-bold h-10 px-3 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Recusar</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Inspeção Completa do Fornecedor */}
      <Dialog open={!!selectedVendor} onOpenChange={(open) => !open && setSelectedVendor(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-8">
          {selectedVendor && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="font-serif text-2xl font-bold text-stone-900">
                    Dossiê de Curadoria: {selectedVendor.companyName}
                  </DialogTitle>
                </div>
                <p className="text-xs text-stone-500">
                  Verifique os dados cadastrados e a conformidade legal para aprovação.
                </p>
              </DialogHeader>

              {/* Informações Legais & Contatos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs">
                <div>
                  <span className="font-bold text-stone-500 uppercase block text-[10px]">
                    Documento Oficial
                  </span>
                  <p className="font-mono font-bold text-stone-900 mt-0.5">
                    {selectedVendor.documentType || "CNPJ"}: {selectedVendor.documentNumber || "Não informado"}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-stone-500 uppercase block text-[10px]">
                    Categoria & Faixa de Preço
                  </span>
                  <p className="font-bold text-stone-900 mt-0.5">
                    {selectedVendor.category} — {selectedVendor.priceRange || "$$"}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-stone-500 uppercase block text-[10px]">
                    Telefone & WhatsApp
                  </span>
                  <p className="font-mono text-stone-900 mt-0.5">
                    {selectedVendor.whatsapp || selectedVendor.phone || "Não informado"}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-stone-500 uppercase block text-[10px]">
                    Investimento Inicial / Ticket Médio
                  </span>
                  <p className="font-mono text-stone-900 mt-0.5">
                    A partir de:{" "}
                    {selectedVendor.startingPrice
                      ? (selectedVendor.startingPrice / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      : "Sob Consulta"}
                  </p>
                </div>
              </div>

              {/* Redes Sociais & Links */}
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedVendor.instagram && (
                  <span className="bg-pink-50 text-pink-700 px-3 py-1 rounded-full font-medium border border-pink-200">
                    Instagram: {selectedVendor.instagram}
                  </span>
                )}
                {selectedVendor.tiktok && (
                  <span className="bg-stone-100 text-stone-800 px-3 py-1 rounded-full font-medium border border-stone-300">
                    TikTok: {selectedVendor.tiktok}
                  </span>
                )}
                {selectedVendor.website && (
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium border border-blue-200">
                    Site: {selectedVendor.website}
                  </span>
                )}
              </div>

              {/* Galeria de Fotos */}
              <div>
                <span className="text-xs font-bold text-stone-700 uppercase block mb-2">
                  Portfólio de Fotos do Trabalho
                </span>
                {(() => {
                  let photos: string[] = [];
                  try {
                    photos = JSON.parse(selectedVendor.galleryImages || "[]");
                  } catch {
                    photos = [];
                  }
                  if (photos.length === 0 && selectedVendor.coverUrl) {
                    photos = [selectedVendor.coverUrl];
                  }

                  return photos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((url, i) => (
                        <div key={i} className="h-24 rounded-xl overflow-hidden bg-stone-100 border">
                          <img src={url} alt={`Portfólio ${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 italic">Nenhuma foto enviada.</p>
                  );
                })()}
              </div>

              {/* Ações dentro do Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <Link href={`/fornecedores/${selectedVendor.id}`} target="_blank">
                  <Button variant="outline" className="rounded-full text-xs font-bold">
                    <span>Ver Página Pública</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>

                {selectedVendor.curationStatus !== "APPROVED" && (
                  <Button
                    onClick={() => handleApprove(selectedVendor)}
                    disabled={isPending}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-bold px-5"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    <span>Aprovar Fornecedor</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Rejeição / Justificativa */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-stone-900">
              Recusar Cadastro de {vendorToReject?.companyName}
            </DialogTitle>
            <p className="text-xs text-stone-500 mt-1">
              Informe a justificativa da recusa para o fornecedor providenciar correções.
            </p>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: CNPJ não confere com a razão social informada."
              className="rounded-2xl text-xs h-12 bg-stone-50"
            />

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRejectModalOpen(false)}
                className="rounded-full text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmReject}
                disabled={isPending}
                className="bg-red-700 hover:bg-red-800 text-white rounded-full text-xs font-bold"
              >
                Confirmar Recusa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
