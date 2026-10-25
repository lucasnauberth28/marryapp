import { somenteDigitos } from "@/lib/formatacao/telefone";

export type Erros = Partial<Record<"name" | "email" | "phone" | "password" | "companyName" | "city" | "document", string>>;

export interface CamposDoCadastro {
  name: string;
  email: string;
  phone: string;
  password: string;
  companyName: string;
  city: string;
  documentType: "CNPJ" | "CPF";
  documentNumber: string;
}

/** Mensagem do servidor -> campo a que ela se refere (para não ficar só num aviso solto). */
export function campoDoErroDoServidor(message: string): keyof Erros | null {
  if (/e-?mail/i.test(message) && !/já existe/i.test(message)) return "email";
  if (/senha/i.test(message)) return "password";
  if (/telefone/i.test(message)) return "phone";
  if (/nome do negócio|nome da empresa/i.test(message)) return "companyName";
  if (/documento/i.test(message)) return "document";
  if (/nome/i.test(message)) return "name";
  return null;
}

export function validarCadastro(c: CamposDoCadastro, isVendor: boolean): Erros {
  const e: Erros = {};
  if (c.name.trim().length < 3) e.name = "Informe seu nome com pelo menos 3 letras.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) e.email = "Confira o e-mail. Ele deve ter um formato como nome@exemplo.com.";
  const digits = somenteDigitos(c.phone);
  if (digits.length < 10 || digits.length > 11) e.phone = "Informe o número com DDD, com 10 ou 11 dígitos.";
  if (c.password.length < 8) e.password = "Use pelo menos 8 caracteres.";
  if (isVendor) {
    if (c.companyName.trim().length < 2) e.companyName = "Informe o nome do negócio.";
    if (c.city.trim().length < 2) e.city = "Informe a cidade onde você atende.";
    if (somenteDigitos(c.documentNumber).length !== (c.documentType === "CPF" ? 11 : 14)) e.document = `Confira o ${c.documentType}.`;
  }
  return e;
}
