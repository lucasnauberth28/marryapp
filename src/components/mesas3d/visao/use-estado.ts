// O estado da tela das mesas em 3D: cenário, convidados, filtros, mesa aberta, câmera e compartilhamento.
import { useState } from "react";
import type { PredefinicaoDaCamera } from "@/lib/mesas3d/engine";
import type { IdDoCenario } from "@/lib/mesas3d/scenarios";
import type { ConvidadoParaSentar } from "@/lib/mesas3d/seating";

export function useEstadoDaVisao(edit: boolean, initialScene: IdDoCenario | null, initialGuests: ConvidadoParaSentar[], initialShareToken: string | null) {
  const [scene, setScene] = useState<IdDoCenario | null>(initialScene);
  const [galleryOpen, setGalleryOpen] = useState(edit && !initialScene);
  const [guests, setGuests] = useState<ConvidadoParaSentar[]>(initialGuests);
  const [filter, setFilter] = useState<"sem" | "todos">("sem");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [cam, setCam] = useState<PredefinicaoDaCamera | null>("cenario");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  return { scene, setScene, galleryOpen, setGalleryOpen, guests, setGuests, filter, setFilter, query, setQuery, selectedId, setSelectedId, openId, setOpenId, dropId, setDropId, cam, setCam, shareOpen, setShareOpen, shareToken, setShareToken };
}

export type EstadoDaVisao = ReturnType<typeof useEstadoDaVisao>;
