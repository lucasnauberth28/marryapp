# Tema escuro

O Aceito tem três opções de aparência: **Claro**, **Escuro** e **Do aparelho** (segue o sistema). O padrão é o tema **Claro**: o claro é o principal, e o escuro só vale por escolha de quem usa.
O tema aplicado vai no atributo `data-theme="light|dark"` do `<html>`. Os tokens do design system
trocam de valor por esse atributo; por isso o código de tela usa só tokens (`bg-papel`, `text-tinta`,
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
`--logo-marca`, `--logo-contra` e `--logo-sobre-ameixa`: ameixa no claro, linho no escuro (as versões `-linho`
do design). `variant="wordmark-linho"` / `"mark-linho"` são para fundo `bg-ameixa`. Os SVGs de
`public/brand` continuam para e-mail, PDF e imagens; o teste `logo-paths.test.ts` garante que os
contornos inline são os mesmos.

## Regras para as telas

- Nunca cor fixa: `#hex`, `rgb()`, `bg-white`, `text-black`, `slate/zinc/gray`. Use os tokens.
- Texto sobre fundo ameixa/sucesso/perigo: `text-on-ameixa` (ou `text-white`, que aponta para ele). No escuro
  essas superfícies clareiam e o texto fica escuro.
- Véu de diálogo/gaveta: `bg-scrim/40` (nunca `bg-tinta/40`, que clareia no escuro).
- Branco de verdade (QR Code, cartão de banco): valor literal, ex.: `bg-[#fff]`.
- Texto sobre foto: `text-[#fff]` com véu escuro, não `text-papel` (que escurece no escuro).
- Sombras: `shadow-[var(--shadow-aceito-1|2)]` ou `shadow-aceito-1|2`; elas trocam com o tema.
- Foco: `focus-visible:outline-2` agora funciona junto de `outline-none` (ver `globals.css`).
