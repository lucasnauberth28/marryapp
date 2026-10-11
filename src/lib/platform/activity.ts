// Registro de atividades (AuditLog) em português: frase de cada ação, grupo para o filtro por tipo e resumo dos detalhes.
// Sem banco nem Next: roda nos testes. Ação nova que ainda não tem frase aparece pelo código (nunca some).

export const ACTION_LABEL: Record<string, string> = {
  // Acesso e conta
  "user.create": "Criou um usuário",
  "user.update": "Alterou um usuário",
  "user.delete": "Excluiu um usuário",
  "role.create": "Criou um perfil de acesso",
  "role.update": "Alterou um perfil de acesso",
  "role.delete": "Excluiu um perfil de acesso",
  "account.delete": "Conta excluída pelo próprio dono",
  "account.password_change": "Trocou a própria senha",
  "account.password_reset": "Redefiniu a senha pelo e-mail",
  // Casais
  "wedding.suspend": "Suspendeu um casamento",
  "wedding.unsuspend": "Reativou um casamento suspenso",
  "wedding.flag": "Marcou um casamento para acompanhar",
  "wedding.unflag": "Tirou a marca de acompanhamento de um casamento",
  "wedding.note_add": "Escreveu uma nota interna sobre um casamento",
  "wedding.password_reset": "Enviou o link de nova senha ao casal",
  "wedding.delete": "Excluiu um casamento",
  "wedding.grant_plan": "Concedeu um plano a um casal",
  "wedding.invite_accept": "Convite do par aceito",
  "wedding.invite_create": "Convidou o par para o casamento",
  "wedding.invite_cancel": "Cancelou um convite do par",
  "impersonation.start": "Entrou como um casal",
  "impersonation.end": "Saiu do painel de um casal",
  "impersonation.write": "Alterou algo no painel de um casal (entrando como ele)",
  "guests.import": "Importou convidados",
  // Fornecedores
  "vendor.approve": "Aprovou um fornecedor na curadoria",
  "vendor.reject": "Recusou um fornecedor na curadoria",
  "vendor.suspend": "Suspendeu um fornecedor",
  "vendor.unsuspend": "Reativou um fornecedor suspenso",
  "vendor.feature": "Mudou o destaque de um fornecedor na vitrine",
  "vendor.grant_plan": "Deu um plano de cortesia a um fornecedor",
  "review.hide": "Ocultou uma avaliação denunciada",
  "review.show": "Voltou a mostrar uma avaliação",
  "review.keep": "Manteve no ar uma avaliação denunciada",
  // Dinheiro
  "subscription.confirm": "Confirmou um Pix à mão",
  "subscription.reject": "Marcou um Pix como não recebido",
  "coupon.create": "Criou um cupom",
  "coupon.update": "Alterou um cupom",
  "coupon.delete": "Excluiu um cupom",
  "catalog.price_update": "Mudou o preço ou o nome de um plano ou recurso",
  "refund.request": "Registrou um pedido de reembolso",
  "refund.decide": "Decidiu um pedido de reembolso",
  "invoice.mark_issued": "Marcou uma nota fiscal como emitida",
  "export.csv": "Exportou uma planilha (CSV)",
  // Domínios
  "domain.request": "Pedido de domínio próprio feito pelo casal",
  "domain.cancel": "Pedido de domínio cancelado pelo casal",
  "domain.start": "Começou o registro de um domínio",
  "domain.registered": "Marcou um domínio como registrado",
  "domain.reject": "Recusou um pedido de domínio",
  "domain.connect": "Conectou um domínio ao site",
  "domain.online": "Colocou um domínio no ar",
  "domain.renewed": "Marcou um domínio como renovado",
  "domain.renewal_reminder": "Avisou o casal da renovação do domínio",
  "domain.reveal_document": "Mostrou o CPF ou CNPJ completo de um titular",
  // Madrinha
  "madrinha.instructions_save": "Salvou uma versão das instruções da Madrinha",
  "madrinha.instructions_publish": "Publicou uma versão das instruções da Madrinha",
  "madrinha.instructions_revert": "Voltou a um texto antigo das instruções da Madrinha",
  "madrinha.article_create": "Criou um texto da base da Madrinha",
  "madrinha.article_update": "Alterou um texto da base da Madrinha",
  "madrinha.article_archive": "Removeu um texto da base da Madrinha",
  "madrinha.override_adjust": "Ajustou a Madrinha de um casal",
  "madrinha.override_block": "Bloqueou a Madrinha de um casal",
  "madrinha.override_unblock": "Desbloqueou a Madrinha de um casal",
  "madrinha.override_enabled": "Ligou ou desligou a Madrinha de um casal",
  // Comunicados
  "announcement.draft_save": "Salvou um rascunho de comunicado",
  "announcement.draft_delete": "Excluiu um rascunho de comunicado",
  "announcement.test": "Enviou um teste de comunicado",
  "announcement.send": "Enviou um comunicado",
  "announcement.resume": "Retomou o envio de um comunicado",
  // Suporte e LGPD
  "ticket.create": "Registrou um pedido de ajuda",
  "ticket.update": "Atualizou um pedido de ajuda",
  "data_request.create": "Registrou um pedido de dados pessoais",
  "data_request.update": "Atendeu um pedido de dados pessoais",
  "data_request.export": "Baixou a exportação de dados de um titular",
  "data_request.delete_account": "Excluiu a conta de um titular (pedido de exclusão)",
  "support.password_reset": "Enviou o link de nova senha a uma pessoa",
  "incident.create": "Registrou um incidente de segurança",
  "incident.update": "Atualizou um incidente de segurança",
  "incident.close": "Fechou um incidente de segurança",
  "incident.reopen": "Reabriu um incidente de segurança",
  // Sistema
  "platform_setting.update": "Mudou uma configuração da plataforma",
  "maintenance.enable": "Ligou o modo de manutenção",
  "maintenance.disable": "Desligou o modo de manutenção",
  "health.alert_sent": "O sistema enviou um alerta de saúde por e-mail",
  "health.alert_test": "Testou os alertas de saúde",
  "whatsapp.reconnect": "Gerou o código para reconectar o WhatsApp",
};

export const TARGET_LABEL: Record<string, string> = {
  subscription: "Assinatura",
  coupon: "Cupom",
  partner_vendor: "Fornecedor",
  role: "Perfil",
  user: "Usuário",
  User: "Usuário",
  wedding: "Casamento",
  Wedding: "Casamento",
  WeddingInvite: "Convite do par",
  DomainOrder: "Pedido de domínio",
  domain_order: "Pedido de domínio",
  refund_request: "Pedido de reembolso",
  vendor_review: "Avaliação",
  support_ticket: "Pedido de ajuda",
  data_request: "Pedido de dados pessoais",
  security_incident: "Incidente de segurança",
  announcement: "Comunicado",
  platform_setting: "Configuração",
  madrinha_instructions: "Instruções da Madrinha",
  madrinha_article: "Base da Madrinha",
  catalog_price: "Preço do catálogo",
  health: "Saúde do sistema",
  whatsapp: "WhatsApp",
  impersonation: "Entrar como",
};

/** Nome das configurações da plataforma (targetId de platform_setting.update). */
export const SETTING_LABEL: Record<string, string> = {
  maintenance: "Modo de manutenção",
  refundPolicy: "Política de reembolso",
  emailSender: "Remetente dos e-mails",
  healthAlerts: "Alertas da saúde do sistema",
  "madrinha.master": "Interruptor geral da Madrinha",
  "madrinha.capabilities": "O que a Madrinha pode fazer",
  "madrinha.limits": "Limites da Madrinha por plano",
  "madrinha.globalCap": "Teto mensal da Madrinha",
  "madrinha.abuse": "Bloqueio por abuso da Madrinha",
};

/** Frase da ação (ou o código, se ainda não houver frase). */
export function actionLabel(action: string): string {
  return ACTION_LABEL[action] ?? action;
}

export function targetLabel(targetType: string | null | undefined): string | null {
  return targetType ? (TARGET_LABEL[targetType] ?? targetType) : null;
}

/** Grupos do filtro "Tipo": cada um reúne ações pelo prefixo do código. */
export const ACTIVITY_GROUPS = [
  { value: "casais", label: "Casais", prefixes: ["wedding.", "impersonation.", "guests."] },
  { value: "fornecedores", label: "Fornecedores", prefixes: ["vendor.", "review."] },
  { value: "dinheiro", label: "Planos e receita", prefixes: ["subscription.", "coupon.", "catalog.", "refund.", "invoice.", "export."] },
  { value: "dominios", label: "Domínios", prefixes: ["domain."] },
  { value: "acesso", label: "Usuários, perfis e contas", prefixes: ["user.", "role.", "account."] },
  { value: "madrinha", label: "Madrinha", prefixes: ["madrinha."] },
  { value: "comunicados", label: "Comunicados", prefixes: ["announcement."] },
  { value: "suporte", label: "Suporte e LGPD", prefixes: ["ticket.", "data_request.", "incident.", "support."] },
  { value: "sistema", label: "Sistema", prefixes: ["platform_setting.", "maintenance.", "health.", "whatsapp."] },
] as const;

export type ActivityGroupValue = (typeof ACTIVITY_GROUPS)[number]["value"];
export const ACTIVITY_GROUP_VALUES = ACTIVITY_GROUPS.map((g) => g.value) as readonly ActivityGroupValue[];

/** Prefixos de ação de um grupo (vazio se o grupo não existe). */
export function groupPrefixes(group: string | undefined): readonly string[] {
  return ACTIVITY_GROUPS.find((g) => g.value === group)?.prefixes ?? [];
}

/** Grupo de uma ação (null se não pertence a nenhum). */
export function groupOf(action: string): ActivityGroupValue | null {
  return ACTIVITY_GROUPS.find((g) => g.prefixes.some((p) => action.startsWith(p)))?.value ?? null;
}

/** "?alvo=wedding:<id>" -> { type, id }; recusa o que não for tipo seguro e id curto. */
export function parseTarget(value: string | undefined): { type: string; id: string } | null {
  if (!value) return null;
  const match = value.match(/^([A-Za-z_]{2,40}):([A-Za-z0-9_-]{1,100})$/);
  return match ? { type: match[1], id: match[2] } : null;
}

const DETAIL_LABEL: Record<string, string> = {
  code: "Código",
  name: "Nome",
  username: "Login",
  role: "Perfil",
  amount: "Valor",
  reason: "Motivo",
  domain: "Domínio",
  gatewayId: "Identificador",
  passwordChanged: "Senha trocada",
  title: "Título",
  subject: "Assunto",
  number: "Número",
  version: "Versão",
  changeNote: "O que mudou",
  channels: "Canais",
  audience: "Público",
  recipients: "Destinatários",
  type: "Tipo",
  from: "De",
  to: "Para",
  planId: "Plano",
  planName: "Plano",
  days: "Dias",
  note: "Nota",
  area: "Área",
  enabled: "Ligado",
  extraMessages: "Mensagens a mais",
  sent: "Enviado",
};

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Resumo curto dos detalhes: só chaves conhecidas e valores simples, no máximo cinco. Nunca mostra o que não está na lista. */
export function summarizeDetails(details: unknown, action?: string, targetId?: string | null): string {
  const parts: string[] = [];
  if (action === "platform_setting.update" && targetId) parts.push(`Configuração: ${SETTING_LABEL[targetId] ?? targetId}`);
  if (details && typeof details === "object" && !Array.isArray(details)) {
    for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
      const label = DETAIL_LABEL[key];
      if (!label || value === null || value === "" || value === undefined) continue;
      if (typeof value === "boolean") parts.push(`${label}: ${value ? "sim" : "não"}`);
      else if (key === "amount" && typeof value === "number") parts.push(`${label}: ${BRL.format(value / 100).replace(/\s/g, " ")}`);
      else if (Array.isArray(value) && value.every((v) => typeof v === "string")) parts.push(`${label}: ${value.join(", ")}`);
      else if (typeof value === "string" || typeof value === "number") parts.push(`${label}: ${String(value).slice(0, 120)}`);
      if (parts.length >= 5) break;
    }
  }
  return parts.slice(0, 5).join(" · ");
}

/** Para onde o alvo leva na administração (null = sem tela). */
export function targetHref(targetType: string | null | undefined, targetId: string | null | undefined): string | null {
  if (!targetType || !targetId) return null;
  if ((targetType === "wedding" || targetType === "Wedding") && /^[0-9a-f-]{36}$/i.test(targetId)) return `/admin/casais/${targetId}`;
  if (targetType === "partner_vendor" && /^[0-9a-f-]{36}$/i.test(targetId)) return `/admin/fornecedores?id=${targetId}`;
  return null;
}
