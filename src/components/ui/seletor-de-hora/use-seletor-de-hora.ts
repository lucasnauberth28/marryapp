// Hora e minutos de um valor "HH:mm" e os botões que sobem e descem cada um.
import { useCallback, useMemo, useState } from "react";

export const PREDEFINICOES_DE_HORA = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

export function useSeletorDeHora(value: string, name: string | undefined, disabled: boolean, onChange: ((e: { target: { name?: string; value: string } }) => void) | undefined) {
  const [isOpen, setIsOpen] = useState(false);

  const { hours, minutes } = useMemo(() => {
    if (!value || !value.includes(":")) return { hours: -1, minutes: -1 };
    const [h, m] = value.split(":").map(Number);
    return { hours: isNaN(h) ? -1 : h, minutes: isNaN(m) ? -1 : m };
  }, [value]);

  const fireChange = useCallback(
    (h: number, m: number) => {
      onChange?.({ target: { name, value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` } });
    },
    [name, onChange],
  );

  /** Passo de hora ou de minuto: sem valor ainda, começa em zero; os botões não fecham a janela. */
  const mover = (parte: "hora" | "minuto", sentido: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const limite = parte === "hora" ? 24 : 60;
    const atual = parte === "hora" ? hours : minutes;
    const novo = atual < 0 ? (sentido === 1 ? 0 : limite - 1) : (atual + sentido + limite) % limite;
    const h = parte === "hora" ? novo : Math.max(hours, 0);
    const m = parte === "minuto" ? novo : Math.max(minutes, 0);
    fireChange(h, m);
  };

  const handleOpenChange = (next: boolean) => {
    if (next && disabled) return;
    if (next && hours < 0) {
      // Sem horário ainda: começa pela hora atual
      const now = new Date();
      fireChange(now.getHours(), now.getMinutes());
    }
    setIsOpen(next);
  };

  const displayValue = hours >= 0 && minutes >= 0 ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}` : "";
  return { isOpen, setIsOpen, hours, minutes, fireChange, mover, handleOpenChange, displayValue };
}
