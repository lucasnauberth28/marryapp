"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { BotaoDeExportar } from "@/components/plataforma/export-button";
import { NativeSelect } from "@/components/ui/select";

/** Escolhe o mês e baixa a planilha do contador. O botão mostra "gerando" até o arquivo ficar pronto. */
export function ExportacaoDoContador({ month, options }: { month: string; options: { value: string; label: string }[] }) {
  const [value, setValue] = useState(month);
  return (
    <div className="flex flex-col gap-4">
      <NativeSelect label="Período" alwaysFloat name="mes" value={value} onChange={(e) => setValue(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
      <p className="text-sm text-tinta-suave">Inclui data, quem pagou, plano, valor, forma de pagamento, situação (pago ou estornado) e o número da nota. Sem CPF, CNPJ nem a taxa do Mercado Pago.</p>
      <BotaoDeExportar variant="default" href={`/api/admin/contador?mes=${encodeURIComponent(value)}`} fallbackName={`contador-${value}.csv`} className="self-start">
        <Download className="size-4" aria-hidden="true" /> Baixar a planilha
      </BotaoDeExportar>
    </div>
  );
}
