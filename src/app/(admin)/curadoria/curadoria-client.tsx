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
  Camera,
  Search,
  Eye,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  approveVendorAction,
  rejectVendorAction,
  getAllVendorsForCurationAction,
} from "@/actions/partner-vendor-actions";
import { toast } from "sonner";

type CurationVendor = Awaited<ReturnType<typeof getAllVendorsForCurationAction>>["vendors"][number];

interface CuradoriaClientProps {
  initialVendors: CurationVendor[];
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
  const [vendors, setVendors] = useState<CurationVendor[]>(initialVendors);
  const [counts, setCounts] = useState(initialCounts);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED">(
    "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<CurationVendor | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [vendorToReject, setVendorToReject] = useState<CurationVendor | null>(null);

  const [isPending, startTransition] = useTransition();

  const filteredVendors = vendors.filter((v) => {
    const matchesTab = activeTab === "ALL" || v.curationStatus === activeTab;
    const matchesSearch =
      v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.documentNumber && v.documentNumber.includes(searchQuery));
    return matchesTab && matchesSearch;
  });

  const handleApprove = (vendor: CurationVendor) => {
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

  const handleOpenReject = (vendor: CurationVendor) => {
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-linha/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-brand-50 text-brand p-2 rounded-xl border border-brand/30">
              <ShieldCheck className="w-5 h-5 text-brand" />
            </span>
            <h1 className="font-display text-[32px] leading-[38px] tracking-[-0.01em] text-tinta text-balance md:text-[40px] md:leading-[46px]">
              Curadoria de fornecedores
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-tinta-suave mt-1">
            Valide a legitimidade documental, portfólio e contatos antes da publicação no marketplace.
          </p>
        </div>

        <Link href="/fornecedores" target="_blank">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-bold gap-1.5 h-10 border-linha hover:bg-linho"
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
              ? "bg-aviso-suave/80 border-amber-300 shadow-md ring-2 ring-amber-400/20"
              : "bg-papel border-linha hover:border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-aviso">
              Pendentes de Auditoria
            </span>
            <Clock className="w-5 h-5 text-aviso" />
          </div>
          <p className="text-3xl font-black font-serif text-amber-900 mt-2">
            {counts.pending}
          </p>
          <p className="text-xs text-aviso mt-1">
            Aguardando validação de CNPJ e fotos
          </p>
        </div>

        <div
          onClick={() => setActiveTab("APPROVED")}
          className={`p-6 rounded-3xl border transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 ${
            activeTab === "APPROVED"
              ? "bg-sucesso-suave/80 border-emerald-300 shadow-md ring-2 ring-emerald-400/20"
              : "bg-papel border-linha hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sucesso">
              Homologados & Ativos
            </span>
            <CheckCircle2 className="w-5 h-5 text-sucesso" />
          </div>
          <p className="text-3xl font-black font-serif text-emerald-900 mt-2">
            {counts.approved}
          </p>
          <p className="text-xs text-sucesso mt-1">
            Listados e disponíveis para os casais
          </p>
        </div>

        <div
          onClick={() => setActiveTab("REJECTED")}
          className={`p-6 rounded-3xl border transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 ${
            activeTab === "REJECTED"
              ? "bg-perigo-suave/80 border-perigo/40 shadow-md ring-2 ring-red-400/20"
              : "bg-papel border-linha hover:border-perigo/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-800">
              Recusados / Em Revisão
            </span>
            <XCircle className="w-5 h-5 text-perigo" />
          </div>
          <p className="text-3xl font-black font-serif text-red-900 mt-2">
            {counts.rejected}
          </p>
          <p className="text-xs text-perigo mt-1">
            Documentação recusada por inconformidade
          </p>
        </div>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-papel p-4 rounded-2xl border border-linha shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-brand-50 text-brand border border-brand/30 shadow-xs"
                : "text-tinta-suave hover:bg-linho"
            }`}
          >
            Todos ({counts.total})
          </button>
          <button
            onClick={() => setActiveTab("PENDING_APPROVAL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PENDING_APPROVAL"
                ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                : "text-tinta-suave hover:bg-linho"
            }`}
          >
            Pendentes ({counts.pending})
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "APPROVED"
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs"
                : "text-tinta-suave hover:bg-linho"
            }`}
          >
            Aprovados ({counts.approved})
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "REJECTED"
                ? "bg-red-100 text-red-900 border border-perigo/40 shadow-xs"
                : "text-tinta-suave hover:bg-linho"
            }`}
          >
            Recusados ({counts.rejected})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-tinta-suave absolute left-3 top-3 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar empresa, CNPJ..."
            className="pl-9 h-10 text-xs rounded-xl bg-linho border-linha"
          />
        </div>
      </div>

      {/* Lista de Fornecedores para Curadoria */}
      <div className="space-y-4">
        {filteredVendors.length === 0 ? (
          <div className="bg-papel rounded-3xl p-12 text-center border border-linha space-y-3">
            <ShieldCheck className="w-10 h-10 mx-auto text-stone-300" />
            <p className="text-sm font-bold text-tinta-suave">
              Nenhum fornecedor encontrado nesta categoria de curadoria.
            </p>
            <p className="text-xs text-tinta-suave">
              Novos cadastros de fornecedores aparecerão aqui automaticamente.
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
                className="bg-papel rounded-3xl p-6 sm:p-7 border border-linha shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-200 hover:shadow-md hover:border-linha"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Logo do Fornecedor */}
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand/30 overflow-hidden shrink-0 flex items-center justify-center">
                    {vendor.logoUrl ? (
                      <img
                        src={vendor.logoUrl}
                        alt={vendor.companyName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-brand" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold font-serif text-tinta">
                        {vendor.companyName}
                      </h2>

                      {vendor.curationStatus === "PENDING_APPROVAL" && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-aviso" />
                          <span>Pendente de Auditoria</span>
                        </span>
                      )}
                      {vendor.curationStatus === "APPROVED" && (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-sucesso" />
                          <span>Homologado no Marketplace</span>
                        </span>
                      )}
                      {vendor.curationStatus === "REJECTED" && (
                        <span className="bg-red-100 text-red-900 border border-perigo/40 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-perigo" />
                          <span>Recusado</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-tinta-suave">
                      <span className="font-bold text-tinta bg-areia px-2 py-0.5 rounded-md">
                        {vendor.category}
                      </span>
                      {vendor.documentNumber && (
                        <span className="font-mono bg-linho px-2 py-0.5 rounded-md border border-linha">
                          {vendor.documentType || "CNPJ"}: {vendor.documentNumber}
                        </span>
                      )}
                      {vendor.priceRange && (
                        <span className="font-mono font-bold text-aviso bg-aviso-suave px-2 py-0.5 rounded-md">
                          Faixa: {vendor.priceRange}
                        </span>
                      )}
                      {gallery.length > 0 && (
                        <span className="flex items-center gap-1 text-tinta-suave">
                          <Camera className="w-3.5 h-3.5" />
                          <span>{gallery.length} fotos</span>
                        </span>
                      )}
                    </div>

                    {vendor.curationNotes && vendor.curationStatus === "REJECTED" && (
                      <p className="text-xs text-perigo italic">
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
                    className="rounded-full text-xs font-bold h-10 px-4 border-linha gap-1.5 cursor-pointer"
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
                      className="text-perigo hover:bg-perigo-suave rounded-full text-xs font-bold h-10 px-3 cursor-pointer"
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-papel rounded-3xl p-6 sm:p-8">
          {selectedVendor && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="font-serif text-2xl font-bold text-tinta">
                    Dossiê de Curadoria: {selectedVendor.companyName}
                  </DialogTitle>
                </div>
                <p className="text-xs text-tinta-suave">
                  Verifique os dados cadastrados e a conformidade legal para aprovação.
                </p>
              </DialogHeader>

              {/* Informações Legais & Contatos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-linho p-4 rounded-2xl border border-linha text-xs">
                <div>
                  <span className="font-bold text-tinta-suave uppercase block text-xs">
                    Documento Oficial
                  </span>
                  <p className="font-mono font-bold text-tinta mt-0.5">
                    {selectedVendor.documentType || "CNPJ"}: {selectedVendor.documentNumber || "Não informado"}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-tinta-suave uppercase block text-xs">
                    Categoria & Faixa de Preço
                  </span>
                  <p className="font-bold text-tinta mt-0.5">
                    {selectedVendor.category} — {selectedVendor.priceRange || "$$"}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-tinta-suave uppercase block text-xs">
                    Telefone & WhatsApp
                  </span>
                  <p className="font-mono text-tinta mt-0.5">
                    {selectedVendor.whatsapp || selectedVendor.phone || "Não informado"}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-tinta-suave uppercase block text-xs">
                    Investimento Inicial / Ticket Médio
                  </span>
                  <p className="font-mono text-tinta mt-0.5">
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
                  <span className="bg-areia text-tinta px-3 py-1 rounded-full font-medium border border-linha">
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
                <span className="text-xs font-bold text-tinta-suave uppercase block mb-2">
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
                        <div key={i} className="h-24 rounded-xl overflow-hidden bg-areia border">
                          <img src={url} alt={`Portfólio ${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-tinta-suave italic">Nenhuma foto enviada.</p>
                  );
                })()}
              </div>

              {/* Ações dentro do Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-linha">
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
        <DialogContent className="sm:max-w-md bg-papel rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-tinta">
              Recusar Cadastro de {vendorToReject?.companyName}
            </DialogTitle>
            <p className="text-xs text-tinta-suave mt-1">
              Informe a justificativa da recusa para o fornecedor providenciar correções.
            </p>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: CNPJ não confere com a razão social informada."
              className="rounded-2xl text-xs h-12 bg-linho"
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
