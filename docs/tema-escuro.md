# Tema escuro

O Aceito tem três opções de aparência: **Claro**, **Escuro** e **Do aparelho** (segue o sistema). O padrão é o tema **Claro**: o claro é o principal, e o escuro só vale por escolha de quem usa.
O tema aplicado vai no atributo `data-theme="light|dark"` do `<html>`. Os tokens do design system
trocam de valor por esse atributo (valores do Manual de Marca v2.0, ver "Paleta" abaixo); por isso o código de tela usa só tokens (`bg-papel`, `text-tinta`,
`border-linha`, `bg-ameixa text-on-ameixa`...) e não precisa de classes `dark:`.

## Como funciona

- `src/lib/theme.ts`: lógica pura (ler cookie, resolver o tema, rotas sempre claras) e o script do `<head>`.
- Script inline no `<head>` do layout raiz: lê o cookie `aceito-theme` (reserva: `localStorage`) e põe
  `data-theme` antes da primeira pintura. Não há leitura de cookie no servidor de propósito: isso
  tornaria dinâmicas a home, os planos, `/login` etc. (hoje estáticas ou ISR). O HTML do servidor sai
  sem `data-theme` (= claro); o script corrige antes de qualquer pixel.
- `ThemeProvider` (no layout raiz): guarda a escolha (cookie de 1 ano + `localStorage`), reage à troca
  ao vivo, à mudança do sistema quando a opção é "Do aparelho" e à navegação entre rotas sempre claras;
  atualiza também o `theme-color` do navegador.
- `globals.css`: `[data-theme="dark"]` redefine os tokens `--color-*`, sombras, variáveis shadcn e as do
  logotipo. `[data-theme="light"]` repete a paleta clara para escopos claros dentro de página escura.
  `src/lib/__tests__/theme-tokens.test.ts` falha se os blocos divergirem ou se o contraste cair.
- O variant `dark:` do Tailwind segue o `data-theme` (não o sistema).

## Seletor

```tsx
import { ThemeToggle, ThemeSegmented, ThemeMenuItems } from "@/components/theme/theme-toggle";

<ThemeToggle />                       // botão sol/lua de 44px com menu Claro / Escuro / Do aparelho
<ThemeToggle variant="outline" />     // aceita variant do Button e className
<ThemeSegmented />                    // três opções sempre visíveis (tela de Configurações)

<DropdownMenuContent>                 // dentro de um menu que já existe (menu da conta)
  <ThemeMenuItems />
</DropdownMenuContent>
```

API: `useTheme()` devolve `{ preference: "light" | "dark" | "system", resolvedTheme: "light" | "dark", setPreference }`.

## Páginas sempre claras

O site do casal e as páginas por link do convidado (`/casamento/**`, `/rsvp`, `/presentes`,
`/dia-do-evento`) usam a cor e as fotos escolhidas pelos noivos e ficam sempre claras:

- `src/app/(public)/casamento/layout.tsx` usa `ThemeLight`: escopo `data-theme="light"` e trava o `<html>`
  em claro enquanto estiver montado (vale também em endereço próprio, onde o caminho é `/`).
- Em caminho de rota, `isLightOnlyPath` faz o script do `<head>` já nascer claro.
- Para uma **prévia** do site dentro de tela que segue o tema (editor do site), use `LightScope`, que não
  mexe no `<html>`.

Na impressão (`@media print`) vale sempre a paleta clara.

## Logotipo

`Logo` (`src/components/brand/logo.tsx`) é SVG inline (sem requisição de imagem) e usa as variáveis
`--logo-marca` e `--logo-sobre-ameixa`: cada logo tem uma única cor (Manual de Marca v2.0), ameixa no claro e rosa
noturno (`#D9A5C6`) no escuro. As versões `-linho` (`variant="lockup-linho"`, `"wordmark-linho"`, `"mark-linho"`) são
para fundo `bg-ameixa`. A assinatura padrão é `lockup` (símbolo e nome na horizontal, mínimo de 160 px de largura);
`wordmark` é só o nome (96 px), `mark` só o símbolo (32 px) e `vertical` o uso institucional. As versões `-linho` usam a geometria clara do kit (compensação óptica sobre fundo escuro), não a mesma arte com outra cor. Os SVGs de
`public/brand` continuam para e-mail, PDF e imagens; o teste `logo-paths.test.ts` garante que os
contornos inline são os mesmos.

## Regras para as telas

- Nunca cor fixa: `#hex`, `rgb()`, `bg-white`, `text-black`, `slate/zinc/gray`. Use os tokens.
- Texto sobre fundo ameixa/sucesso/perigo: `text-on-ameixa` (ou `text-white`, que aponta para ele). No escuro
  essas superfícies clareiam e o texto fica escuro.
- Véu de diálogo/gaveta: `bg-scrim/40` (nunca `bg-tinta/40`, que clareia no escuro).
- Branco de verdade (QR Code, cartão de banco): valor literal, ex.: `bg-[#fff]`.
- Texto sobre foto: `text-[#fff]` com véu escuro, não `text-papel` (que escurece no escuro).
- Sombras: `shadow-aceito-1` e `shadow-aceito-2` (ou `shadow-[var(--shadow-aceito-1)]`); elas trocam com o tema.
- Foco: `focus-visible:outline-2` agora funciona junto de `outline-none` (ver `globals.css`).

## Paleta do Manual de Marca v2.0

Os nomes dos tokens são os de sempre; só os valores seguem o manual (p.9 a 11). Claro: `linho` é o papel `#FCFBFA`
(fundo da página), `papel` é o branco `#FFFFFF` (cartões), `areia` é a névoa `#F7F1F5`, `ameixa-suave` `#F4EAF1`,
`tinta` `#1F1A1D`, `tinta-suave` é o grafite `#5F585C`, e há `ameixa-viva` `#8C3F74`, `rosa` `#F2D7E7` (apoio, nunca
texto), `profundo` `#2E1226` e `profundo-2` `#43203A`. Escuro (sem inversão automática): página `#141113`, cartão
`#1D181B`, destaque suave (`areia`) `#35222F`, texto `#F2EEF0`, secundário `#D9C2D1`, ameixa noturno `#D9A5C6`
(hover `#E8C3DA`, viva `#E8B4D5`), `profundo` `#241020` e `ameixa-suave` `#3A1B32` (acento profundo).

- `salvia` (antigo verde-sálvia de apoio) virou ameixa-viva: o manual só admite verde como estado.
- `champanhe` não é mais decoração (o manual diz que dourado não faz parte do mestre): fios, arcos e selos usam `rosa`.
  Sobrou só nas estrelas de avaliação, que são dado funcional (a nota vai sempre no texto também).
- Cores de estado (`sucesso`, `aviso`, `perigo`) não mudaram.
- `theme-tokens.test.ts` confere os valores do manual e a tabela de contraste da p.11.

## Tipografia e números

Títulos em Urbanist (`font-display`, 500 por padrão, `font-semibold` para 600) e interface em Geist 400/500/600
(`font-sans`). Os dois são variáveis, subconjunto latino, carregados com `next/font/local` a partir de
`src/app/fonts` (o build não usa rede). Urbanist não tem algarismos tabulares: números e dinheiro usam `font-num`
(Geist, tabular). IBM Plex Mono (`font-mono`) só aparece em códigos (cupom, chave Pix, ids).
O nome "aceito" nunca é digitado como logotipo: use o componente `Logo`.
