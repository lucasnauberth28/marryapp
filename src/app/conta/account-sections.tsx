"use client";

import { SecaoDeAparencia, SecaoDeNotificacoes } from "./secoes/avisos-e-aparencia";
import { SecaoDeDados, SecaoDeExclusao } from "./secoes/dados-e-exclusao";
import { SecaoDaPessoaParceira } from "./secoes/par";
import { SecaoDeSenha } from "./secoes/senha";
import type { Propriedades } from "./secoes/tipos";

export function SecoesDaConta({ kind, account, wedding, pushPublicKey, notifications }: Propriedades) {
  return (
    <div className="flex flex-col gap-6">
      {wedding ? <SecaoDaPessoaParceira wedding={wedding} /> : null}
      <SecaoDeNotificacoes pushPublicKey={pushPublicKey} notifications={notifications} />
      <SecaoDeAparencia />
      <SecaoDeSenha />
      <SecaoDeDados kind={kind} createdAt={account.createdAt} companyName={account.companyName} coupleNames={wedding?.coupleNames ?? null} />
      {kind !== "admin" ? <SecaoDeExclusao kind={kind} isLastMember={wedding ? wedding.members.length <= 1 : false} /> : null}
    </div>
  );
}
