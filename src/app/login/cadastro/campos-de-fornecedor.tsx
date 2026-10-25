import { Building2, FileText, MapPin } from "lucide-react";
import { Campo } from "@/components/ui/field";
import { SelecaoNativa } from "@/components/ui/select";
import { CATEGORIAS_DE_FORNECEDOR } from "@/app/(fornecedor)/_lib/perfil-do-fornecedor";
import { mascararDocumentoDigitando } from "@/lib/formatacao/documento";
import { cn } from "@/lib/utils";
import type { Campos } from "./use-cadastro";
import type { Erros } from "./validacao";

function EscolhaDoDocumento({ campos }: { campos: Campos }) {
  const { documentType, setDocumentType, setDocumentNumber } = campos;
  return (
    <div role="radiogroup" aria-label="Tipo de documento" className="grid w-fit grid-cols-2 gap-1 rounded-[10px] bg-areia p-1">
      {(["CNPJ", "CPF"] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={documentType === t}
          onClick={() => {
            setDocumentType(t);
            setDocumentNumber((v) => mascararDocumentoDigitando(v, t));
          }}
          className={cn("min-h-9 rounded-[8px] px-4 text-sm font-semibold transition-colors", documentType === t ? "bg-papel text-tinta shadow-[var(--shadow-aceito-1)]" : "text-tinta-suave hover:text-tinta")}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function CamposDeFornecedor({ campos, errors }: { campos: Campos; errors: Erros }) {
  return (
    <>
      <Campo id="cadastro-companyName" label="Nome do negócio" icon={Building2} error={errors.companyName}>
        {(c) => <input {...c} id="cadastro-companyName" name="organization" autoComplete="organization" value={campos.companyName} onChange={(e) => campos.setCompanyName(e.target.value)} />}
      </Campo>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelecaoNativa id="cadastro-category" label="Categoria" value={campos.category} onChange={(e) => campos.setCategory(e.target.value)}>
          {CATEGORIAS_DE_FORNECEDOR.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </SelecaoNativa>
        <Campo id="cadastro-city" label="Cidade onde atende" icon={MapPin} error={errors.city}>
          {(c) => <input {...c} id="cadastro-city" name="address-level2" autoComplete="address-level2" placeholder="Ex.: Campinas" value={campos.city} onChange={(e) => campos.setCity(e.target.value)} />}
        </Campo>
      </div>
      <div className="flex flex-col gap-2">
        <EscolhaDoDocumento campos={campos} />
        <Campo id="cadastro-document" label={campos.documentType} icon={FileText} error={errors.document} hint="Usado só pela curadoria. Não aparece no seu perfil.">
          {(c) => (
            <input
              {...c}
              id="cadastro-document"
              inputMode="numeric"
              value={campos.documentNumber}
              onChange={(e) => campos.setDocumentNumber(mascararDocumentoDigitando(e.target.value, campos.documentType))}
              placeholder={campos.documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
            />
          )}
        </Campo>
      </div>
    </>
  );
}
