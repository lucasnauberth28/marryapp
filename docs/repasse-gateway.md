# Repasse dos presentes: o que os gateways permitem

Consulta feita em **23/10/2026**. Decisão do dono: **nada daqui está implementado**. Existe só o destino cadastrado pelo casal (`WeddingPayoutAccount`) e a interface `PayoutExecutor` (`src/lib/repasse/payout-executor.ts`), sem implementação ativa.

## Limite desta pesquisa (leia primeiro)

O servidor onde isto foi escrito não consegue abrir as páginas dos gateways (o WebFetch falhou com "getaddrinfo ENOTFOUND" para `mercadopago.com.br` e `docs.asaas.com`). Tudo abaixo vem de **resultados de busca que citam trechos das páginas oficiais**, não de leitura completa delas. Por isso:

- **Não há tabela de custos confirmada.** Nenhum número de tarifa está escrito aqui de propósito. Peça a tabela por escrito ao comercial de cada gateway.
- Prazos de liberação e exigências de cadastro (KYC) estão marcados como **a confirmar**.
- Antes de decidir, alguém precisa abrir os links e conferir.

## Os dois jeitos de dividir ou repassar

1. **Split no pagamento:** o gateway divide o valor na hora de cobrar (parte do casal, parte do Aceito). Exige que o casal tenha uma conta, subconta ou "recebedor" cadastrado no gateway (com os dados e a verificação de identidade que o gateway pedir).
2. **Repasse depois (payout):** o dinheiro cai na conta do Aceito e o Aceito manda o líquido por Pix ou transferência para a chave ou conta que o casal cadastrou. É o modelo que combina com o destino já cadastrado no app. O casal não precisa abrir conta em gateway nenhum.

## Mercado Pago (gateway atual)

- **Split de pagamentos 1:1 (marketplace):** o Aceito cria o pagamento com a comissão no campo `application_fee`, usando o token OAuth do vendedor. A tarifa do Mercado Pago sai primeiro do vendedor e depois a comissão do marketplace. Exige que **cada casal seja um vendedor com conta Mercado Pago** que autoriza o Aceito (OAuth). Pelos trechos encontrados, o split 1:1 só vale para pagamentos com dinheiro em conta Mercado Pago (não há destino em conta bancária externa). Reembolso é dividido proporcionalmente entre as partes. Para casais leigos, pedir que abram e autorizem uma conta Mercado Pago é atrito alto. **Não combina com o destino "chave Pix ou conta" que o casal cadastrou.**
- **Money out / Payouts (Pix para chave):** `POST /v1/transaction-intents/process`, com `X-Idempotency-Key` obrigatório, assinatura (`X-signature`) obrigatória em produção, e tipos de chave EMAIL, PHONE, CPF, CNPJ ou PIX_CODE, mais o titular (`owner.identification`). A conta de origem precisa de saldo, e o recurso exige pré-requisitos (a página de pré-requisitos diz que a conta de destino precisa estar registrada para Payouts: **a confirmar o que isso significa na prática e se a conta do Aceito está habilitada**). É o que mais se encaixa no modelo "repasse depois": o líquido sai da conta Mercado Pago do Aceito para a chave do casal, sem o casal ter conta no gateway.
- **A confirmar:** habilitação comercial do Payouts para a conta do Aceito, limites, tarifa por transferência, prazo para o dinheiro de presentes ficar disponível no saldo do Aceito (liberação do Pix e do cartão) e prazo do Pix de saída.

Links: [Split 1:1 para marketplace](https://www.mercadopago.com.br/developers/pt/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace), [Money out, visão geral](https://www.mercadopago.com.br/developers/pt/docs/money-out/landing), [Money out, configuração](https://www.mercadopago.com.br/developers/pt/docs/money-out/integration-configuration), [Money out, pré-requisitos](https://www.mercadopago.com.br/developers/en/docs/money-out/prerequisites), [Referência: Pix transfer](https://www.mercadopago.com.br/developers/en/reference/money-out/pix-transfer/post).

## Asaas

- **Subcontas:** cada cliente pode ter uma subconta própria, com pagamentos individuais. O formato **white label** "precisa ser alinhado e implementado previamente com o gerente de conta" (a condição comercial é negociada, **a confirmar**). Cada subconta passa pelo cadastro e verificação do Asaas (KYC, **a confirmar os documentos exigidos de pessoa física**).
- **Split:** divide a cobrança entre contas Asaas por percentual ou valor fixo (**a confirmar na página de split**, que não pôde ser aberta).
- **Transferência:** a FAQ de transferências diz que transferência entre contas Asaas só vale com vínculo (conta principal e subconta, ou da mesma hierarquia). Para Pix a chave ou conta externa, a API pede definir a modalidade (`operationType` PIX ou TED). Isso permite o modelo "repasse depois" a partir da conta do Aceito.
- **Custos:** a página do Asaas fala em um número de Pix grátis por mês, mas o blog e a página divergem (30 ou 100) e remetem às condições do contrato. **Sem tabela confirmada.**

Links: [White label](https://docs.asaas.com/docs/about-white-label), [FAQ de transferências](https://docs.asaas.com/docs/faq-de-transfer%C3%AAncias), [Split de pagamentos](https://docs.asaas.com/docs/split-de-pagamentos), [Pix no Asaas](https://www.asaas.com/pix-asaas).

## Pagar.me

- Trabalha com **recebedores (recipients)** e split por percentual ou valor. Os recebedores são cadastrados no painel ou na API v5, com verificação cadastral. Os recebíveis são registrados na registradora, como a regra do mercado exige.
- **Prazos de liquidação e exigências de KYC dos recebedores: não confirmados** (a busca só trouxe material de terceiros). **Custos: não confirmados.**
- Exigiria trocar de gateway ou rodar dois ao mesmo tempo, com nova integração de cartão e Pix.

Links: [Guia de terceiros sobre recebedores do Pagar.me](https://intercom.help/interno-vnda/pt-BR/articles/10262399-split-de-pagamento-pagar-me-v5-interno), [Visão geral de split (Stone)](https://conteudo.stone.com.br/split-de-pagamento-tudo-o-que-voce-precisa-saber/). Procure a documentação oficial em docs.pagar.me, seção de recipients e split.

## Comparação rápida

| | Mercado Pago split 1:1 | Mercado Pago Payouts (Pix) | Asaas subconta + split | Pagar.me recebedores |
| --- | --- | --- | --- | --- |
| Casal precisa de conta no gateway | Sim (vendedor com OAuth) | Não | Sim (subconta, com verificação) | Sim (recebedor, com verificação) |
| Usa a chave ou conta já cadastrada no app | Não | Sim | Em parte (transferência para fora) | Em parte |
| Troca de gateway | Não | Não | Sim | Sim |
| Custos | a confirmar | a confirmar | a confirmar | a confirmar |
| Prazos | a confirmar | a confirmar | a confirmar | a confirmar |

## Recomendação (a validar com os gateways e com um advogado)

1. **Curto prazo, sem integrar nada:** repasse **manual pela equipe**, por Pix a partir da conta do Aceito, usando o destino que o casal cadastrou e confirmou (`verifiedAt`), com o valor líquido de `getPayoutBalance` e cada repasse registrado no AuditLog. É o que o app diz hoje, e não promete prazo.
2. **Se o dono quiser automatizar, comece pelo Mercado Pago Payouts (Pix):** é o único que mantém o gateway atual e o destino cadastrado pelo casal, sem pedir que os casais abram contas. Antes de construir: confirmar com o comercial do Mercado Pago a habilitação do Payouts, as tarifas, os limites e os prazos de liberação do saldo. Implemente como uma classe `PayoutExecutor`, com chave de idempotência por repasse, só para destinos confirmados, e decifrando o destino só na hora de enviar.
3. **Asaas (subcontas e split) vale como alternativa** se o dono preferir que o dinheiro **nunca passe pela conta do Aceito** e o gateway cuide do KYC dos casais. Custa mais atrito no cadastro e uma nova integração.
4. **Ponto jurídico para o dono levar a um advogado:** receber dinheiro de terceiros e repassá-lo (modelo "repasse depois") pode ter implicações regulatórias do Banco Central e de tributos. O split ou a subconta no gateway costuma deslocar parte dessa responsabilidade para o gateway. Isto **não é parecer jurídico**; é um ponto a validar antes de ativar repasses.

## O que o dono precisa decidir

- Qual caminho (manual, Mercado Pago Payouts, Asaas, outro) e a partir de quando.
- O prazo e a forma do repasse, para informar ao casal antes de ativar (a tela e os termos dizem que serão informados).
- Quem na equipe libera repasses e como se confere (sugestão: duas pessoas para valores acima de um limite).
- Conferir com um advogado a questão regulatória acima.
