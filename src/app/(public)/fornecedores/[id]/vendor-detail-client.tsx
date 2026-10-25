"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";
import { CabecalhoDaLanding } from "@/components/landing/landing-header";
import { RodapeDaLanding } from "@/components/landing/landing-footer";
import { estiloDoBotao, estiloDoContainerDaLanding } from "@/components/landing/styles";
import type { FornecedorPublico } from "@/actions/vitrine/consulta";
import { interpretarGaleria, interpretarRegioes } from "@/app/(fornecedor)/_lib/perfil-do-fornecedor";
import { formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import { cn } from "@/lib/utils";
import { SecaoComoAtende, SecaoSobre, TituloDoFornecedor } from "./componentes/apresentacao";
import { SecaoDeAvaliacoes } from "./componentes/avaliacoes";
import { GaleriaDeFotos, JanelaDeFotos } from "./componentes/galeria";
import { PedidoDeOrcamento } from "./componentes/pedido-de-orcamento";

interface PropriedadesDoDetalheDoFornecedor {
  vendor: FornecedorPublico;
  /** Hoje em Brasília ("AAAA-MM-DD"), mínimo da consulta de disponibilidade. */
  todayIso: string;
}

function compartilhar(titulo: string) {
  if (navigator.share) {
    navigator.share({ title: titulo, url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado.");
  }
}

/** Celular: preço e o botão principal sempre à mão (sticky: o pai tem transform, que quebraria o fixed). */
function BarraDoCelular({ price }: { price: string | null }) {
  return (
    <div className="sticky bottom-0 z-40 -mx-4 mt-auto flex items-center justify-between gap-4 border-t border-linha bg-papel px-4 py-3 sm:-mx-6 sm:px-6 lg:hidden">
      <p className="flex flex-col leading-tight">
        <span className="text-sm text-tinta-suave">{price ? "A partir de" : "Preço"}</span>
        <span className="font-num text-xl text-tinta">{price ?? "Sob consulta"}</span>
      </p>
      <a href="#orcamento" className={cn(estiloDoBotao.primary, "flex-1 max-w-[240px]")}>
        Pedir orçamento
      </a>
    </div>
  );
}

function fotosDoFornecedor(vendor: FornecedorPublico) {
  const galeria = interpretarGaleria(vendor.galleryImages);
  return galeria.length === 0 && vendor.coverUrl ? [vendor.coverUrl] : galeria;
}

export function DetalheDoFornecedorCliente({ vendor, todayIso }: PropriedadesDoDetalheDoFornecedor) {
  const galleryImages = fotosDoFornecedor(vendor);
  const serviceRegions = interpretarRegioes(vendor.serviceRegions);
  const reviews = vendor.reviews;
  // WhatsApp direto é recurso do Pro/Master (o servidor nem envia o número dos demais).
  const directWhatsapp = vendor.planTier !== "FREE" ? vendor.whatsapp?.replace(/\D/g, "") || null : null;
  // Foto da galeria em destaque no celular e foto aberta na janela de fotos (-1 = fechada).
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(-1);
  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : vendor.rating.toFixed(1);
  const price = vendor.startingPrice && vendor.startingPrice > 0 ? formatarReaisInteiros(vendor.startingPrice) : null;

  return (
    <div className="flex min-h-screen flex-col bg-linho font-sans text-tinta">
      <CabecalhoDaLanding />

      <div className={cn(estiloDoContainerDaLanding, "flex flex-1 flex-col gap-6 pb-0 pt-4 sm:pt-6 lg:pb-24")}>
        <div className="flex items-center justify-between gap-3">
          <Link href="/fornecedores" className={cn(estiloDoBotao.quiet, "-ml-3 shrink-0")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Fornecedores
          </Link>
          <button type="button" onClick={() => compartilhar(vendor.companyName)} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm)}>
            <Share2 className="size-4" aria-hidden="true" />
            Compartilhar
          </button>
        </div>

        <GaleriaDeFotos images={galleryImages} companyName={vendor.companyName} ativa={activeIndex} aoEscolher={setActiveIndex} aoAmpliar={setLightbox} />

        <div className="flex flex-wrap items-start gap-x-12 gap-y-10 pt-4">
          <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-10">
            <TituloDoFornecedor vendor={vendor} regioes={serviceRegions} averageRating={averageRating} />
            <SecaoSobre description={vendor.description} />
            <SecaoComoAtende vendor={vendor} regioes={serviceRegions} />
            <SecaoDeAvaliacoes reviews={reviews} companyName={vendor.companyName} />
          </main>
          <PedidoDeOrcamento vendor={vendor} todayIso={todayIso} price={price} whatsapp={directWhatsapp} />
        </div>
        <BarraDoCelular price={price} />
      </div>

      <JanelaDeFotos images={galleryImages} companyName={vendor.companyName} aberta={lightbox} aoMudar={setLightbox} />
      <RodapeDaLanding />
    </div>
  );
}
