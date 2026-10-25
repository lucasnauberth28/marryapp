// O estado do cadastro: campos da conta, validação, envio ao servidor e para onde ir depois.
import { useState, useTransition } from "react";
import { cadastrarContaDoPlano, type DadosDoCadastroDoPlano } from "@/actions/subscription-actions";
import { CATEGORIAS_DE_FORNECEDOR } from "@/app/(fornecedor)/_lib/perfil-do-fornecedor";
import type { EtapaDoCadastro, OpcaoDePlano } from "../auth-config";
import { campoDoErroDoServidor, validarCadastro, type CamposDoCadastro, type Erros } from "./validacao";

export function useCamposDoCadastro() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIAS_DE_FORNECEDOR[0]);
  const [city, setCity] = useState("");
  const [documentType, setDocumentType] = useState<"CNPJ" | "CPF">("CNPJ");
  const [documentNumber, setDocumentNumber] = useState("");
  return { name, setName, email, setEmail, phone, setPhone, password, setPassword, companyName, setCompanyName, category, setCategory, city, setCity, documentType, setDocumentType, documentNumber, setDocumentNumber };
}

export type Campos = ReturnType<typeof useCamposDoCadastro>;

interface EntradaDoEnvio {
  campos: Campos;
  isVendor: boolean;
  plan: OpcaoDePlano | undefined;
  customModules: string[] | undefined;
  aoMudarEtapa: (etapa: EtapaDoCadastro) => void;
}

function dadosParaEnviar({ campos: c, isVendor, plan, customModules }: EntradaDoEnvio): DadosDoCadastroDoPlano {
  return {
    planType: isVendor ? "VENDOR" : "COUPLE",
    planId: (plan?.id ?? "basic") as DadosDoCadastroDoPlano["planId"],
    modules: plan?.id === "custom" ? customModules : undefined,
    planName: plan?.name ?? "",
    amount: plan?.price ?? 0,
    name: c.name,
    email: c.email.trim().toLowerCase(),
    phone: c.phone,
    password: c.password,
    companyName: isVendor ? c.companyName : undefined,
    vendorCategory: isVendor ? c.category : undefined,
    vendorRegion: isVendor ? c.city : undefined,
    documentType: isVendor ? c.documentType : undefined,
    documentNumber: isVendor ? c.documentNumber : undefined,
  };
}

export function useEnvioDoCadastro(entrada: EntradaDoEnvio) {
  const { campos, isVendor, plan, aoMudarEtapa } = entrada;
  const [errors, setErrors] = useState<Erros>({});
  const [formError, setFormError] = useState<{ message: string; existingAccount?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  // Casal no plano gratuito vai direto ao onboarding: o botão fica carregando até a página trocar.
  const [leaving, setLeaving] = useState(false);

  const mostrarErroDoServidor = (message: string) => {
    const field = campoDoErroDoServidor(message);
    if (!field) return setFormError({ message, existingAccount: /já existe uma conta/i.test(message) });
    // O que já foi preenchido fica como está; o erro aparece no campo a que se refere.
    setErrors({ [field]: message });
    document.getElementById(`cadastro-${field}`)?.focus();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const found = validarCadastro(campos as CamposDoCadastro, isVendor);
    setErrors(found);
    const primeiro = Object.keys(found)[0];
    if (primeiro) return void document.getElementById(`cadastro-${primeiro}`)?.focus();

    startTransition(async () => {
      const res = await cadastrarContaDoPlano(dadosParaEnviar(entrada));
      if (!res.success) return mostrarErroDoServidor(res.error || "Não foi possível criar a conta agora. Tentem novamente.");
      const next = ("redirectTo" in res && res.redirectTo) || null;
      setRedirectTo(next);
      if (plan && plan.price > 0) aoMudarEtapa("pagamento");
      else if (!isVendor) {
        // Sem tela de "conta criada" entre o cadastro e as boas-vindas. Navegação completa: lê o cookie de sessão novo.
        setLeaving(true);
        window.location.assign(next ?? "/boas-vindas");
      } else aoMudarEtapa("pronto");
    });
  };

  return { errors, formError, isPending, redirectTo, leaving, setLeaving, submit };
}
