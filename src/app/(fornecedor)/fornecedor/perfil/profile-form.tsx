"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/motion/reveal";
import { updateVendorProfile, type VendorProfileInput } from "@/actions/vendor-panel-actions";
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
const INPUT =
  "min-h-11 w-full rounded-xl border border-linha-forte bg-papel px-4 text-base text-tinta placeholder:text-tinta-suave/80 disabled:opacity-60";
const LABEL = "text-sm font-semibold text-tinta";
const HINT = "text-[13px] text-tinta-suave";
const BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";

const FORM_ID = "perfil-fornecedor";

function Field({
  id,
  label,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className={HINT}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

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
    <button type="submit" form={FORM_ID} disabled={isPending} className={cn(BTN, "bg-ameixa text-on-ameixa hover:bg-ameixa-hover")}>
      {isPending ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : null}
      {isPending ? "Salvando…" : "Salvar"}
    </button>
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

        <Reveal as="section" variant="up" delay={80} className={cn(CARD, "grid grid-cols-1 gap-4 sm:grid-cols-2")}>
          <h2 className="text-xl leading-7 font-semibold sm:col-span-2">Sobre o negócio</h2>
          <Field id="f-nome" label="Nome">
            <input
              id="f-nome"
              name="companyName"
              required
              maxLength={120}
              autoComplete="organization"
              value={values.companyName}
              onChange={set("companyName")}
              className={INPUT}
            />
          </Field>
          <Field id="f-cat" label="Categoria">
            <select id="f-cat" name="category" value={values.category} onChange={set("category")} className={cn(INPUT, "cursor-pointer")}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-reg" label="Regiões que atende" hint="Separe por vírgula. Ex.: Campinas, Valinhos, Vinhedo">
            <input
              id="f-reg"
              name="serviceRegions"
              maxLength={600}
              value={values.serviceRegions}
              onChange={set("serviceRegions")}
              aria-describedby="f-reg-hint"
              className={INPUT}
            />
          </Field>
          <Field id="f-preco" label="Preço inicial (R$)" hint="Aparece no card da vitrine. Casais filtram por preço.">
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-tinta-suave">
                R$
              </span>
              <input
                id="f-preco"
                name="startingPrice"
                inputMode="decimal"
                placeholder="6.800"
                maxLength={20}
                value={values.startingPrice}
                onChange={set("startingPrice")}
                aria-describedby="f-preco-hint"
                className={cn(INPUT, "pl-11")}
              />
            </div>
          </Field>
          <Field id="f-sobre" label="Apresentação" hint="Estilo, equipe e o que está incluído." className="sm:col-span-2">
            <textarea
              id="f-sobre"
              name="description"
              rows={5}
              maxLength={4000}
              value={values.description}
              onChange={set("description")}
              aria-describedby="f-sobre-hint"
              className={cn(INPUT, "min-h-32 resize-y py-3")}
            />
          </Field>
        </Reveal>

        <Reveal as="section" variant="up" delay={160} className={cn(CARD, "grid grid-cols-1 gap-4 sm:grid-cols-2")}>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <h2 className="text-xl leading-7 font-semibold">Contato e redes</h2>
            <p className={HINT}>Os pedidos de orçamento chegam aqui no painel; o WhatsApp aparece para os casais no Plano Pro.</p>
          </div>
          <Field id="f-whats" label="WhatsApp" hint="Com DDD. Ex.: (11) 99876-5432">
            <input
              id="f-whats"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
              value={values.whatsapp}
              onChange={set("whatsapp")}
              aria-describedby="f-whats-hint"
              className={INPUT}
            />
          </Field>
          <Field id="f-insta" label="Instagram">
            <input
              id="f-insta"
              name="instagram"
              placeholder="@seuperfil"
              maxLength={80}
              autoCapitalize="none"
              value={values.instagram}
              onChange={set("instagram")}
              className={INPUT}
            />
          </Field>
          <Field id="f-site" label="Site" className="sm:col-span-2">
            <input
              id="f-site"
              name="website"
              type="url"
              inputMode="url"
              placeholder="seusite.com.br"
              autoComplete="url"
              maxLength={200}
              value={values.website}
              onChange={set("website")}
              className={INPUT}
            />
          </Field>
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
