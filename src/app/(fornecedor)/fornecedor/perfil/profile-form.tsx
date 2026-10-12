"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/motion/reveal";
import { updateVendorProfile, type VendorProfileInput } from "@/actions/vendor-panel-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FormValues = {
  companyName: string;
  category: string;
  description: string;
  startingPrice: string;
  serviceRegions: string;
  whatsapp: string;
  instagram: string;
  website: string;
};

const CARD = "rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6";
const HINT = "text-[13px] text-tinta-suave";
const BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";

const FORM_ID = "perfil-fornecedor";

export function ProfileForm({
  vendorId,
  isPublic,
  categories,
  initial,
  notice,
  portfolio,
}: {
  vendorId: string;
  isPublic: boolean;
  categories: string[];
  initial: FormValues;
  /** Aviso da curadoria, exibido logo abaixo do título. */
  notice?: React.ReactNode;
  /** Portfólio (fotos): vem antes dos campos de texto, como no design. */
  portfolio?: React.ReactNode;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateVendorProfile(values satisfies VendorProfileInput);
      if (res.success) {
        toast.success(isPublic ? "Perfil salvo. Os casais já veem a nova versão." : "Perfil salvo.");
      } else {
        const message = res.error ?? "Não foi possível salvar o perfil.";
        setError(message);
        toast.error(message);
      }
    });
  }

  const saveButton = (
    <Button type="submit" form={FORM_ID} loading={isPending}>
      Salvar
    </Button>
  );

  return (
    <>
      <Reveal variant="fade" className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase">Meu perfil</p>
          <h1 className="font-display text-[28px] leading-9 font-medium md:text-[40px] md:leading-[46px]">
            Como os casais veem você
          </h1>
        </div>
        <div className="hidden gap-2 sm:flex">
          {isPublic ? (
            <Link
              href={`/fornecedores/${vendorId}`}
              target="_blank"
              rel="noopener"
              className={cn(BTN, "border border-linha-forte bg-papel text-tinta hover:bg-areia")}
            >
              <Eye aria-hidden="true" className="size-[18px]" />
              Pré-visualizar
              <span className="sr-only">(abre em nova aba)</span>
            </Link>
          ) : null}
          {saveButton}
        </div>
      </Reveal>

      {notice}

      {portfolio}

      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-6" aria-describedby={error ? "perfil-erro" : undefined}>
        {error ? (
          <p id="perfil-erro" role="alert" className="rounded-xl bg-perigo-suave px-4 py-3 text-sm font-medium text-perigo">
            {error}
          </p>
        ) : null}

        <Reveal as="section" variant="up" delay={80} className={cn(CARD, "grid grid-cols-1 gap-5 sm:grid-cols-2")}>
          <h2 className="text-xl leading-7 font-semibold sm:col-span-2">Sobre o negócio</h2>
          <Input
            id="f-nome"
            label="Nome"
            name="companyName"
            required
            maxLength={120}
            autoComplete="organization"
            value={values.companyName}
            onChange={set("companyName")}
          />
          <NativeSelect id="f-cat" label="Categoria" name="category" value={values.category} onChange={set("category")}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
          <Input
            id="f-reg"
            label="Regiões que atende"
            hint="Separe por vírgula. Ex.: Campinas, Valinhos, Vinhedo"
            name="serviceRegions"
            maxLength={600}
            value={values.serviceRegions}
            onChange={set("serviceRegions")}
          />
          <Input
            id="f-preco"
            label="Preço inicial"
            prefix="R$"
            hint="Aparece no card da vitrine. Casais filtram por preço."
            name="startingPrice"
            inputMode="decimal"
            placeholder="6.800"
            maxLength={20}
            value={values.startingPrice}
            onChange={set("startingPrice")}
          />
          <Textarea
            id="f-sobre"
            label="Apresentação"
            hint="Estilo, equipe e o que está incluído."
            fieldClassName="sm:col-span-2"
            name="description"
            rows={5}
            maxLength={4000}
            value={values.description}
            onChange={set("description")}
            inputClassName="min-h-32"
          />
        </Reveal>

        <Reveal as="section" variant="up" delay={160} className={cn(CARD, "grid grid-cols-1 gap-5 sm:grid-cols-2")}>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <h2 className="text-xl leading-7 font-semibold">Contato e redes</h2>
            <p className={HINT}>Os pedidos de orçamento chegam aqui no painel; o WhatsApp aparece para os casais no Plano Pro.</p>
          </div>
          <Input
            id="f-whats"
            label="WhatsApp"
            hint="Com DDD. Ex.: (11) 99876-5432"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            value={values.whatsapp}
            onChange={set("whatsapp")}
          />
          <Input
            id="f-insta"
            label="Instagram"
            name="instagram"
            placeholder="@seuperfil"
            maxLength={80}
            autoCapitalize="none"
            value={values.instagram}
            onChange={set("instagram")}
          />
          <Input
            id="f-site"
            label="Site"
            fieldClassName="sm:col-span-2"
            name="website"
            type="url"
            inputMode="url"
            placeholder="seusite.com.br"
            autoComplete="url"
            maxLength={200}
            value={values.website}
            onChange={set("website")}
          />
        </Reveal>

        <div className="flex flex-col gap-2 sm:hidden">
          {saveButton}
          {isPublic ? (
            <Link
              href={`/fornecedores/${vendorId}`}
              target="_blank"
              rel="noopener"
              className={cn(BTN, "border border-linha-forte bg-papel text-tinta hover:bg-areia")}
            >
              <Eye aria-hidden="true" className="size-[18px]" />
              Pré-visualizar
              <span className="sr-only">(abre em nova aba)</span>
            </Link>
          ) : null}
        </div>
      </form>
    </>
  );
}
