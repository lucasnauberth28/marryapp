import { Aparicao } from "@/components/motion/reveal";
import { Entrada } from "@/components/ui/input";
import { SelecaoNativa } from "@/components/ui/select";
import { AreaDeTexto } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ESTILO_DA_DICA, ESTILO_DO_CARTAO } from "./estilos";

export type ValoresDoFormulario = {
  companyName: string;
  category: string;
  description: string;
  startingPrice: string;
  serviceRegions: string;
  whatsapp: string;
  instagram: string;
  website: string;
};

export type MudarCampoDoPerfil = (key: keyof ValoresDoFormulario) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;

interface PropriedadesDosCampos {
  values: ValoresDoFormulario;
  set: MudarCampoDoPerfil;
}

export function SobreONegocio({ values, set, categories }: PropriedadesDosCampos & { categories: string[] }) {
  return (
    <Aparicao as="section" variant="up" delay={80} className={cn(ESTILO_DO_CARTAO, "grid grid-cols-1 gap-5 sm:grid-cols-2")}>
      <h2 className="text-xl leading-7 font-semibold sm:col-span-2">Sobre o negócio</h2>
      <Entrada id="f-nome" label="Nome" name="companyName" required maxLength={120} autoComplete="organization" value={values.companyName} onChange={set("companyName")} />
      <SelecaoNativa id="f-cat" label="Categoria" name="category" value={values.category} onChange={set("category")}>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </SelecaoNativa>
      <Entrada id="f-reg" label="Regiões que atende" hint="Separe por vírgula. Ex.: Campinas, Valinhos, Vinhedo" name="serviceRegions" maxLength={600} value={values.serviceRegions} onChange={set("serviceRegions")} />
      <Entrada id="f-preco" label="Preço inicial" prefix="R$" hint="Aparece no card da lista de fornecedores. Casais filtram por preço." name="startingPrice" inputMode="decimal" placeholder="6.800" maxLength={20} value={values.startingPrice} onChange={set("startingPrice")} />
      <AreaDeTexto id="f-sobre" label="Apresentação" hint="Estilo, equipe e o que está incluído." fieldClassName="sm:col-span-2" name="description" rows={5} maxLength={4000} value={values.description} onChange={set("description")} inputClassName="min-h-32" />
    </Aparicao>
  );
}

export function ContatoERedes({ values, set }: PropriedadesDosCampos) {
  return (
    <Aparicao as="section" variant="up" delay={160} className={cn(ESTILO_DO_CARTAO, "grid grid-cols-1 gap-5 sm:grid-cols-2")}>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <h2 className="text-xl leading-7 font-semibold">Contato e redes</h2>
        <p className={ESTILO_DA_DICA}>Os pedidos de orçamento chegam aqui no painel; o WhatsApp aparece para os casais no Plano Pro.</p>
      </div>
      <Entrada id="f-whats" label="WhatsApp" hint="Com DDD. Ex.: (11) 99876-5432" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={values.whatsapp} onChange={set("whatsapp")} />
      <Entrada id="f-insta" label="Instagram" name="instagram" placeholder="@seuperfil" maxLength={80} autoCapitalize="none" value={values.instagram} onChange={set("instagram")} />
      <Entrada id="f-site" label="Site" fieldClassName="sm:col-span-2" name="website" type="url" inputMode="url" placeholder="seusite.com.br" autoComplete="url" maxLength={200} value={values.website} onChange={set("website")} />
    </Aparicao>
  );
}
