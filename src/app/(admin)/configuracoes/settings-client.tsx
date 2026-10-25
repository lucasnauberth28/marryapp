"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { atualizarConfiguracoes } from "@/actions/settings-actions";
import { Botao } from "@/components/ui/button";
import { Cartao, ConteudoDoCartao, CabecalhoDoCartao, TituloDoCartao, DescricaoDoCartao } from "@/components/ui/card";
import { SeletorDeData } from "@/components/ui/date-picker";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { CartaoDeConfiguracaoDoTour } from "@/components/tour/tour-restart";
import { SeletorSegmentadoDoTema } from "@/components/theme/theme-toggle";
import { toast } from "sonner";

interface PropriedadesDasConfiguracoesCliente {
  initialSettings: { rsvpDeadline: Date | string | null };
  /** Resumo do casamento (os dados são editados no editor do site). */
  summary: { names: string; date: string | null; place: string | null; address: string | null };
  canSeePlan: boolean;
}

function InformacaoEmDestaque({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm font-semibold leading-5 text-tinta-suave">{label}</dt>
      <dd className="min-w-0 break-words text-base leading-6 text-tinta">{children}</dd>
    </div>
  );
}

export function ConfiguracoesCliente({ initialSettings, summary, canSeePlan }: PropriedadesDasConfiguracoesCliente) {
  const [isPending, startTransition] = useTransition();
  const [rsvpDeadline, setRsvpDeadline] = useState(
    initialSettings.rsvpDeadline ? new Date(initialSettings.rsvpDeadline).toISOString().split("T")[0] : ""
  );

  function handleSave() {
    const toastId = toast.loading("Salvando o prazo…");
    startTransition(async () => {
      const res = await atualizarConfiguracoes({ rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null });
      if (res.success) {
        toast.success("Prazo de confirmação salvo.", { id: toastId });
      } else {
        toast.error(res.error ?? "Não deu para salvar o prazo. Tente de novo.", { id: toastId });
      }
    });
  }

  return (
    <div className="flex max-w-[880px] flex-col gap-6">
      <CabecalhoDaPagina eyebrow="Conta" title="Configurações" />

      <Cartao className="gap-4">
        <CabecalhoDoCartao>
          <TituloDoCartao>O casamento</TituloDoCartao>
          <DescricaoDoCartao>Nomes, data, local, cor do tema e fotos ficam no editor do site, com prévia ao vivo.</DescricaoDoCartao>
        </CabecalhoDoCartao>
        <ConteudoDoCartao className="flex flex-col gap-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <InformacaoEmDestaque label="Nomes no site">{summary.names}</InformacaoEmDestaque>
            <InformacaoEmDestaque label="Data">{summary.date ?? "Ainda sem data"}</InformacaoEmDestaque>
            <InformacaoEmDestaque label="Local">{summary.place ?? "A definir"}</InformacaoEmDestaque>
            <InformacaoEmDestaque label="Endereço do site">{summary.address ?? "Disponível depois de concluir o cadastro"}</InformacaoEmDestaque>
          </dl>
          <div>
            <Botao asChild variant="outline">
              <Link href="/site-builder">Editar no editor do site</Link>
            </Botao>
          </div>
        </ConteudoDoCartao>
      </Cartao>

      <Cartao className="gap-4">
        <CabecalhoDoCartao>
          <TituloDoCartao>Confirmação de presença</TituloDoCartao>
        </CabecalhoDoCartao>
        <ConteudoDoCartao className="flex flex-col gap-4">
          <SeletorDeData
            id="rsvpDeadline"
            label="Prazo de confirmação"
            hint="Opcional. Depois desta data, a página de confirmação do site deixa de aceitar respostas. A Liz também usa este prazo nas sugestões."
            className="sm:max-w-[320px]"
            value={rsvpDeadline}
            onChange={(e) => setRsvpDeadline(e.target.value)}
          />
          <div>
            <Botao onClick={handleSave} loading={isPending}>
              Salvar prazo
            </Botao>
          </div>
        </ConteudoDoCartao>
      </Cartao>

      <Cartao className="gap-4">
        <CabecalhoDoCartao>
          <TituloDoCartao>Aparência</TituloDoCartao>
          <DescricaoDoCartao>Claro, escuro ou o do seu aparelho. Vale para este navegador e não muda o site do casamento, que fica sempre claro.</DescricaoDoCartao>
        </CabecalhoDoCartao>
        <ConteudoDoCartao>
          <SeletorSegmentadoDoTema />
        </ConteudoDoCartao>
      </Cartao>

      <Cartao className="gap-4">
        <CabecalhoDoCartao>
          <TituloDoCartao>Onde receber os presentes</TituloDoCartao>
          <DescricaoDoCartao>A chave Pix ou a conta que vocês escolhem para receber o dinheiro dos presentes. Os dados ficam criptografados.</DescricaoDoCartao>
        </CabecalhoDoCartao>
        <ConteudoDoCartao>
          <Botao asChild variant="outline">
            <Link href="/configuracoes/recebimento">Cadastrar ou ver o destino</Link>
          </Botao>
        </ConteudoDoCartao>
      </Cartao>

      <Cartao className="gap-4">
        <CabecalhoDoCartao>
          <TituloDoCartao>WhatsApp</TituloDoCartao>
          <DescricaoDoCartao>Conexão do número que envia convites e lembretes aos convidados.</DescricaoDoCartao>
        </CabecalhoDoCartao>
        <ConteudoDoCartao>
          <Botao asChild variant="outline">
            <Link href="/configuracoes/whatsapp">Gerenciar conexão</Link>
          </Botao>
        </ConteudoDoCartao>
      </Cartao>

      <Cartao className="gap-4">
        <CabecalhoDoCartao>
          <TituloDoCartao>Quem pode editar</TituloDoCartao>
          <DescricaoDoCartao>Convite para a outra pessoa do casal, senha, avisos e exclusão da conta ficam em Minha conta.</DescricaoDoCartao>
        </CabecalhoDoCartao>
        <ConteudoDoCartao>
          <Botao asChild variant="outline">
            <Link href="/conta">Abrir Minha conta</Link>
          </Botao>
        </ConteudoDoCartao>
      </Cartao>

      <CartaoDeConfiguracaoDoTour />

      {canSeePlan && (
        <Cartao className="gap-4">
          <CabecalhoDoCartao>
            <TituloDoCartao>Plano</TituloDoCartao>
            <DescricaoDoCartao>Veja o plano do casamento, o que está incluído e os pagamentos.</DescricaoDoCartao>
          </CabecalhoDoCartao>
          <ConteudoDoCartao>
            <Botao asChild variant="outline">
              <Link href="/plano">Ver plano e pagamentos</Link>
            </Botao>
          </ConteudoDoCartao>
        </Cartao>
      )}
    </div>
  );
}
