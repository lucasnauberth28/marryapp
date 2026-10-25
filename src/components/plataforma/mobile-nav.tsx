"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ContagensDoMenuDaPlataformaNaPropriedade } from "@/components/plataforma/nav-list";
import { ABAS_MOVEIS_DA_PLATAFORMA, itemDaPlataformaEstaAtivo, gruposDeMaisDaPlataforma } from "@/components/plataforma/nav-config";
import { AbasInferiores, FolhaMais } from "./mobile-nav-partes";

/** Fecha a folha ao trocar de página e trava a rolagem do fundo (e o Esc fecha) enquanto aberta. */
function useFolhaMais(pathname: string) {
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com a navegação
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return { moreOpen, setMoreOpen };
}

interface Propriedades {
  counts: ContagensDoMenuDaPlataformaNaPropriedade;
  name: string;
  initials: string;
  roleLabel: string;
}

/**
 * Navegação da administração no celular (some a partir de md): barra inferior com as quatro áreas mais usadas
 * e "Mais", que abre uma folha com todas as outras, o cartão da conta e "Sair". Mesmo padrão do painel do casal.
 */
export function MenuMovelDaPlataforma({ counts, name, initials, roleLabel }: Propriedades) {
  const pathname = usePathname();
  const { moreOpen, setMoreOpen } = useFolhaMais(pathname);
  const moreGroups = gruposDeMaisDaPlataforma();
  const inTabs = ABAS_MOVEIS_DA_PLATAFORMA.some((tab) => itemDaPlataformaEstaAtivo(pathname, tab));
  // Número do "Mais": soma do que está nos itens escondidos nele (para não perder o aviso)
  const hiddenCount = moreGroups.flatMap((g) => g.items).reduce((sum, item) => sum + (item.countKey ? (counts[item.countKey] ?? 0) : 0), 0);

  return (
    <>
      <AbasInferiores pathname={pathname} moreOpen={moreOpen} inTabs={inTabs} hiddenCount={hiddenCount} aoAlternarMais={() => setMoreOpen((v) => !v)} />
      {moreOpen && <FolhaMais groups={moreGroups} counts={counts} name={name} initials={initials} roleLabel={roleLabel} aoFechar={() => setMoreOpen(false)} />}
    </>
  );
}
