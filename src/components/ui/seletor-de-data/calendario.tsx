import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const DIAS_DA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Propriedades {
  currentMonth: Date;
  selectedDate: Date | null;
  aoMudarMes: (atualizar: (mes: Date) => Date) => void;
  aoEscolher: (dia: Date) => void;
  aoLimpar: (e: React.MouseEvent) => void;
}

function NavegacaoDoMes({ currentMonth, aoMudarMes }: Pick<Propriedades, "currentMonth" | "aoMudarMes">) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <button type="button" onClick={() => aoMudarMes((prev) => subMonths(prev, 1))} aria-label="Mês anterior" className="p-1 rounded-lg hover:bg-areia text-tinta-suave transition cursor-pointer">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="font-bold text-xs text-tinta capitalize font-sans">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</span>
      <button type="button" onClick={() => aoMudarMes((prev) => addMonths(prev, 1))} aria-label="Próximo mês" className="p-1 rounded-lg hover:bg-areia text-tinta-suave transition cursor-pointer">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function GradeDeDias({ currentMonth, selectedDate, aoEscolher }: Pick<Propriedades, "currentMonth" | "selectedDate" | "aoEscolher">) {
  const monthStart = startOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 0 }), end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 }) });
  return (
    <div className="grid grid-cols-7 gap-1 text-center font-sans">
      {days.map((day: Date) => {
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
        const isCurrentMonth = isSameMonth(day, currentMonth);
        return (
          <button
            key={day.toString()}
            type="button"
            onClick={() => aoEscolher(day)}
            aria-label={format(day, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            aria-pressed={isSelected}
            className={cn(
              "h-8 w-8 mx-auto rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer",
              !isCurrentMonth && "text-tinta-suave/50 font-normal",
              isCurrentMonth && !isSelected && "text-tinta font-medium hover:bg-areia",
              isSelected && "bg-brand text-white font-bold shadow-xs hover:bg-brand-600",
            )}
          >
            {format(day, "d")}
          </button>
        );
      })}
    </div>
  );
}

export function CalendarioDoMes({ currentMonth, selectedDate, aoMudarMes, aoEscolher, aoLimpar }: Propriedades) {
  return (
    <>
      <NavegacaoDoMes currentMonth={currentMonth} aoMudarMes={aoMudarMes} />
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DIAS_DA_SEMANA.map((day) => (
          <span key={day} className="text-xs font-semibold text-tinta-suave py-1">
            {day}
          </span>
        ))}
      </div>
      <GradeDeDias currentMonth={currentMonth} selectedDate={selectedDate} aoEscolher={aoEscolher} />
      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-linha text-xs">
        <button type="button" onClick={() => aoEscolher(new Date())} className="text-brand hover:underline font-bold text-xs cursor-pointer">
          Hoje
        </button>
        {selectedDate && (
          <button type="button" onClick={aoLimpar} className="text-tinta-suave hover:text-tinta font-medium text-xs cursor-pointer">
            Limpar
          </button>
        )}
      </div>
    </>
  );
}
