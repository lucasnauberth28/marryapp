// O valor do seletor de data (controlado ou não), a data escolhida e o mês mostrado no calendário.
import { useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns";

interface Entrada {
  name: string | undefined;
  controlledValue: string | undefined;
  defaultValue: string;
  onChange: ((e: { target: { name?: string; value: string } }) => void) | undefined;
}

export function useSeletorDeData({ name, controlledValue, defaultValue, onChange }: Entrada) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(controlledValue ?? defaultValue);

  // Acompanha o valor controlado (ajuste durante o render, sem efeito)
  const [prevControlled, setPrevControlled] = useState(controlledValue);
  if (prevControlled !== controlledValue) {
    setPrevControlled(controlledValue);
    if (controlledValue !== undefined) setInternalValue(controlledValue);
  }

  const selectedDate = useMemo(() => {
    const val = controlledValue !== undefined ? controlledValue : internalValue;
    if (!val) return null;
    const parsed = parseISO(val);
    return isValid(parsed) ? parsed : null;
  }, [controlledValue, internalValue]);

  const [currentMonth, setCurrentMonth] = useState<Date>(() => selectedDate || new Date());

  // Ao mudar a data escolhida, o calendário vai para o mês dela
  const [prevSelected, setPrevSelected] = useState(selectedDate);
  if (prevSelected !== selectedDate) {
    setPrevSelected(selectedDate);
    if (selectedDate) setCurrentMonth(selectedDate);
  }

  const escolher = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd");
    setInternalValue(formatted);
    onChange?.({ target: { name, value: formatted } });
    setOpen(false);
  };

  const limpar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalValue("");
    onChange?.({ target: { name, value: "" } });
  };

  return { open, setOpen, selectedDate, currentMonth, setCurrentMonth, escolher, limpar, valorParaOFormulario: controlledValue !== undefined ? controlledValue : internalValue };
}
