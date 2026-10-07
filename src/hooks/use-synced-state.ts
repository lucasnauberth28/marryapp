"use client";

import { useState } from "react";

/**
 * Estado local inicializado a partir de uma prop e ressincronizado quando a prop muda
 * (ex.: após router.refresh() trazer dados novos do servidor). Evita recarregar a página inteira.
 * Padrão recomendado pelo React para "ajustar estado quando uma prop muda", sem useEffect.
 */
export function useSyncedState<T>(value: T) {
  const [state, setState] = useState(value);
  const [previous, setPrevious] = useState(value);
  if (value !== previous) {
    setPrevious(value);
    setState(value);
  }
  return [state, setState] as const;
}
