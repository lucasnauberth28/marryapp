import Link from "next/link";
import { CheckCircle2, Info, MinusCircle } from "lucide-react";
import { PageHeader } from "@/components/plataforma/page-header";
import { Panel } from "@/components/plataforma/panel";
import { StatusChip } from "@/components/plataforma/status-chip";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { getPlatformSetting } from "@/lib/platform/settings";
import { INTEGRATIONS, describeLimit, integrationStatus } from "@/lib/platform/config-core";
import { splitBackAt } from "@/lib/platform/maintenance-core";
import { SecurityLimits } from "@/lib/security/rate-limiter";
import { MODULOS_DO_CASAL } from "@/lib/pricing-modules";
import { modulosDoPlano } from "@/lib/wedding-plan-modules";
import { EmailSenderForm, MaintenanceForm, RefundPolicyForm } from "./_components/config-forms";

export const metadata = { title: "Configurações da plataforma" };
export const dynamic = "force-dynamic";

const SECTIONS = [
  { id: "textos", label: "Textos legais" },
  { id: "presentes", label: "Presentes e taxas" },
  { id: "manutencao", label: "Manutenção" },
  { id: "planos", label: "Recursos por plano" },
  { id: "integracoes", label: "Integrações" },
  { id: "emails", label: "E-mails e remetentes" },
  { id: "reembolso", label: "Reembolso" },
  { id: "limites", label: "Limites de uso" },
] as const;

const LIMITS: { key: keyof typeof SecurityLimits; label: string }[] = [
  { key: "SIGNUP", label: "Cadastros por rede" },
  { key: "LOGIN", label: "Tentativas de entrar por rede" },
  { key: "LOGIN_ACCOUNT", label: "Tentativas de entrar por conta" },
  { key: "CHECKOUT", label: "Tentativas de pagamento" },
  { key: "RSVP", label: "Respostas de presença" },
  { key: "MESSAGES", label: "Mensagens de WhatsApp disparadas pelo painel" },
  { key: "PUBLIC_FORM", label: "Recados, avaliações e pedidos de orçamento" },
  { key: "PAYMENT_STATUS", label: "Consulta do status de pagamento" },
];

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-6">
      <Panel title={title} description={description}>
        {children}
      </Panel>
    </div>
  );
}

export default async function Page() {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  const [maintenance, emailSender, refund] = await Promise.all([getPlatformSetting("maintenance"), getPlatformSetting("emailSender"), getPlatformSetting("refundPolicy")]);
  const back = splitBackAt(maintenance.backAt);
  const integrations = INTEGRATIONS.map((def) => integrationStatus(def, process.env));
  const planColumns = [
    { id: "basic", label: "Básico", modules: [] as string[] },
    { id: "classic", label: "Classic", modules: modulosDoPlano("classic") },
    { id: "vip", label: "VIP", modules: modulosDoPlano("vip") },
  ];
  const feePercent = process.env.MP_FEE_PERCENT?.trim();
  const feeFixed = process.env.MP_FEE_FIXED?.trim();

  return (
    <>
      <PageHeader eyebrow="Sistema" title="Configurações da plataforma" description="Mudanças aqui valem para todos. Cada uma fica no Registro de atividades." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Seções desta página" className="-mx-4 overflow-x-auto px-4 lg:sticky lg:top-6 lg:mx-0 lg:self-start lg:overflow-visible lg:px-0">
          <ul className="flex gap-1 lg:flex-col">
            {SECTIONS.map((s) => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} className="inline-flex min-h-11 items-center rounded-xl px-3 text-[15px] font-semibold text-tinta-suave hover:bg-areia hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa lg:w-full">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-6">
          <Section id="textos" title="Textos legais" description="Os textos estão no código do app; o aceite de quem se cadastra ainda não é registrado.">
            <ul className="divide-y divide-linha">
              {[
                { href: "/termos", label: "Termos de uso" },
                { href: "/privacidade", label: "Política de privacidade" },
              ].map((l) => (
                <li key={l.href} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-[15px] font-semibold text-tinta">{l.label}</span>
                  <Link href={l.href} target="_blank" rel="noopener" className="text-sm font-semibold text-ameixa underline underline-offset-2">
                    Abrir a página atual
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-start gap-2 text-sm leading-5 text-tinta-suave">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Não há versões nem data de publicação registradas, e o cadastro não guarda qual versão a pessoa aceitou.
            </p>
          </Section>

          <Section id="presentes" title="Presentes e taxas" description="Só leitura: a taxa vem das regras do plano e das variáveis do servidor.">
            <dl className="divide-y divide-linha text-[15px]">
              <div className="flex flex-wrap justify-between gap-2 py-2.5">
                <dt className="text-tinta-suave">Plano Básico</dt>
                <dd className="font-semibold text-tinta">3,99% por presente recebido</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 py-2.5">
                <dt className="text-tinta-suave">Planos pagos (Classic e VIP)</dt>
                <dd className="font-semibold text-tinta">0% no Pix</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 py-2.5">
                <dt className="text-tinta-suave">Taxa do Mercado Pago repassada no checkout</dt>
                <dd className="font-semibold text-tinta">{feePercent ? `${feePercent.replace(".", ",")}%` : "4,99% (padrão do código)"}{feeFixed && Number(feeFixed) > 0 ? ` + R$ ${feeFixed.replace(".", ",")}` : ""}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm leading-5 text-tinta-suave">Para mudar, é preciso alterar as variáveis MP_FEE_PERCENT e MP_FEE_FIXED na Vercel (e o texto das páginas de planos).</p>
          </Section>

          <Section id="manutencao" title="Modo de manutenção" description="Quando ligado, casais e convidados veem um aviso e o painel do casal fica só para leitura.">
            <MaintenanceForm initial={{ enabled: maintenance.enabled, message: maintenance.message, backDate: back.date, backTime: back.time }} />
          </Section>

          <Section id="planos" title="Recursos por plano" description="Só leitura: o que cada plano libera é regra do código, não configuração.">
            <div className="overflow-x-auto rounded-2xl border border-linha">
              <table className="w-full min-w-[480px] border-collapse text-left text-[15px]">
                <caption className="sr-only">Recursos liberados por plano de casal</caption>
                <thead>
                  <tr className="border-b border-linha text-[13px] text-tinta-suave">
                    <th scope="col" className="px-4 py-3 font-semibold">Recurso</th>
                    {planColumns.map((p) => (
                      <th key={p.id} scope="col" className="px-4 py-3 text-center font-semibold">{p.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULOS_DO_CASAL.map((m) => (
                    <tr key={m.id} className="border-b border-linha last:border-b-0">
                      <th scope="row" className="px-4 py-3 font-normal text-tinta">{m.name}</th>
                      {planColumns.map((p) => (
                        <td key={p.id} className="px-4 py-3 text-center">
                          {p.modules.includes(m.id) ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-sucesso"><CheckCircle2 className="size-4" aria-hidden="true" />Inclui</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-tinta-suave"><MinusCircle className="size-4" aria-hidden="true" />Não inclui</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm leading-5 text-tinta-suave">O plano adaptado vale pelos recursos que o casal escolhe. Hoje o servidor só bloqueia WhatsApp, check-in com QR Code e domínio próprio; os outros estão liberados para todos.</p>
          </Section>

          <Section id="integracoes" title="Integrações" description="Só mostra se a variável está preenchida no servidor. Nenhuma chave é exibida ou gravada aqui.">
            <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
              {integrations.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                  <span className="text-[15px] font-semibold text-tinta">{i.name}</span>
                  <span className="flex items-center gap-3">
                    {i.tail && <span className="font-mono text-sm text-tinta-suave">••••{i.tail}</span>}
                    {i.connected ? <StatusChip tone="sucesso" icon={CheckCircle2}>Conectado</StatusChip> : <StatusChip tone="neutro" icon={MinusCircle}>Não configurado</StatusChip>}
                  </span>
                </li>
              ))}
              <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                <span className="text-[15px] font-semibold text-tinta">API da Liz</span>
                <StatusChip tone="neutro" icon={MinusCircle}>Ainda não conectada</StatusChip>
              </li>
            </ul>
            <p className="mt-3 text-sm leading-5 text-tinta-suave">Para trocar ou conectar uma chave, configure na Vercel (variáveis de ambiente) e faça um novo deploy.</p>
          </Section>

          <Section id="emails" title="E-mails e remetentes">
            <EmailSenderForm initial={emailSender} />
          </Section>

          <Section id="reembolso" title="Política de reembolso" description="O texto que o casal lê e que orienta a sua decisão em Planos e receita.">
            <RefundPolicyForm initial={{ days: refund.days, text: refund.text }} />
          </Section>

          <Section id="limites" title="Limites de uso" description="Só leitura: protegem o Aceito de abuso e vêm do código. Pessoas de verdade quase nunca chegam perto.">
            <dl className="divide-y divide-linha text-[15px]">
              {LIMITS.map((l) => (
                <div key={l.key} className="flex flex-wrap justify-between gap-2 py-2.5">
                  <dt className="text-tinta-suave">{l.label}</dt>
                  <dd className="font-semibold text-tinta">{describeLimit(SecurityLimits[l.key].limit, SecurityLimits[l.key].windowMs)}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>
      </div>
    </>
  );
}
