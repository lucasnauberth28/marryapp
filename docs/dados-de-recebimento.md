# Dados de recebimento do casal

Onde o casal diz que quer receber os presentes (chave Pix ou conta bancária). Tela: `/configuracoes/recebimento`.

**Estado atual, sem enfeite:** o Aceito só GUARDA o destino. Não existe repasse automático: o dinheiro dos presentes chega ao Aceito e o repasse é liberado pela equipe. A interface `PayoutExecutor` (`src/lib/repasse/payout-executor.ts`) está documentada e sem implementação. A escolha do gateway está em `docs/repasse-gateway.md`.

## O que fica no banco

Tabela `wedding_payout_accounts`, uma linha por casamento.

| Coluna | Conteúdo |
| --- | --- |
| `holderDocumentEnc` | CPF ou CNPJ do titular, **cifrado** |
| `pixKeyEnc` / `bankAccountEnc` | chave Pix, ou JSON com banco, agência, conta, dígito e tipo, **cifrados** (só um dos dois, garantido por um CHECK no banco) |
| `holderName`, `holderDocumentKind`, `pixKeyType` | nome do titular, "CPF" ou "CNPJ" e o tipo da chave: abertos |
| `holderDocumentLast4`, `keyHint` | máscaras para mostrar sem decifrar ("CPF final 4725", "Pix CPF final 25", "Banco 260, ag 0001, conta •••• 45") |
| `encKeyVersion` | versão da chave de criptografia usada |
| `verifiedAt` | nulo até o casal confirmar; qualquer troca de dados volta a deixá-lo nulo |
| `registeredByUserId` | quem cadastrou ou trocou por último |

Nada bancário em texto puro no banco, em log, no AuditLog, em e-mail, em aviso ou em mensagem de erro. O AuditLog guarda só ator, ação (`payout.account_create`, `_update`, `_verify`, `_delete`), alvo e o tipo (Pix ou conta). As telas leem por `getPayoutAccountView`, que não seleciona as colunas `*Enc`.

A agência e o código do banco aparecem na máscara da conta (como pediu o dono). Sozinhos não movimentam dinheiro, mas se isso for um incômodo, a máscara pode esconder a agência em `bankHint` (`src/lib/repasse/payout-input.ts`).

## A variável `PAYOUT_ENCRYPTION_KEY`

Chave AES-256-GCM de **32 bytes** aleatórios, em base64 ou hexadecimal (64 caracteres). Código: `src/lib/security/payout-crypto.ts`.

- Falha fechado: sem a variável, com tamanho diferente de 32 bytes ou fraca (todos os bytes iguais), o cadastro fica indisponível e a tela avisa. Não existe valor padrão.
- Cada valor cifrado leva um IV aleatório novo e uma etiqueta de autenticação. O formato é `p1.<versão da chave>.<iv>.<etiqueta>.<cifrado>`.
- O "contexto" (`payout:<casamento>:<campo>`) entra como dado autenticado: um valor copiado para outro casamento ou outro campo não abre.
- Nada disso é registrado em log: as mensagens de erro são genéricas.

### Como gerar e configurar

1. Gere em um terminal seu, fora do repositório: `openssl rand -base64 32`.
2. Na Vercel: Settings, Environment Variables, nome `PAYOUT_ENCRYPTION_KEY`, valor gerado, ambientes Production e Preview (marque como sensível). Faça um novo deploy.
3. Guarde uma cópia da chave em um cofre de senhas. **Perdeu a chave, perdeu os dados cifrados** (o casal teria de cadastrar de novo). Não há como recuperar.
4. Não commite o valor, não cole em chat, issue ou log.

### Como girar a chave (rotação)

1. Gere uma chave nova. Na Vercel, passe a chave **antiga** para `PAYOUT_ENCRYPTION_KEY_PREVIOUS`, coloque a **nova** em `PAYOUT_ENCRYPTION_KEY` e some 1 em `PAYOUT_ENCRYPTION_KEY_VERSION` (se estava vazia, a versão era 1; ponha `2`). Faça o deploy.
2. Dados novos já saem com a versão nova; os antigos continuam abrindo pela chave anterior (só a versão imediatamente anterior é aceita).
3. Para recifrar o que sobrou, use `needsReencryption` e `reencryptPayoutSecret` do mesmo módulo em um script de manutenção (ainda não existe script pronto: só será preciso na primeira rotação). `encKeyVersion` na tabela mostra o que ainda está na versão antiga.
4. Quando nada estiver na versão antiga, remova `PAYOUT_ENCRYPTION_KEY_PREVIOUS`.

Se a chave vazar: gire na hora, recife, e avise os casais afetados (a LGPD pode exigir comunicação ao titular e à ANPD).

## Quem pode mexer

- Cadastrar, trocar, confirmar e remover: só a própria pessoa do casal, com a **senha atual** na hora (limite de 6 tentativas em 15 minutos por pessoa). "Entrar como" da administração e a conta de emergência são recusados no servidor, mesmo com edição liberada.
- O casamento vem sempre da sessão, nunca do navegador.
- A administração (`/admin/casais/[id]`, aba Pagamentos e plano) vê só a máscara. Não há botão que decifre.
- A cada mudança, todas as pessoas do casamento recebem um aviso no painel e por e-mail, sem o dado.

## Saldo a repassar

`getPayoutBalance(weddingId)` em `src/lib/repasse/payout-balance-server.ts` soma, por casamento, os presentes aprovados e devolve bruto, taxa, líquido e "a conferir" (Pix gerado e ainda não confirmado). Usa `netAmount` e `fee` gravados quando fecham com o valor pago; senão calcula com `giftAmounts` pelo plano vigente. É só leitura: não cria repasse nem move dinheiro.
