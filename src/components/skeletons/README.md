# Esqueletos de carregamento

Padrão do Aceito: **toda espera mostra um esqueleto que espelha o layout final**. Nada de tela em branco,
nada de spinner de tela inteira. Import único: `import { … } from "@/components/skeletons"`.

## Regras do padrão

1. **Todo `loading.tsx` e todo fallback de `<Suspense>` usa estes componentes** e espelha o layout final
   (mesmas alturas, grades e espaçamentos da tela carregada). Sem `animate-pulse`, sem `<p>Carregando...</p>`.
2. **Sem spinner de tela inteira.** Spinner só DENTRO de botão em ação (`<Button loading>`, `<SubmitButton>`).
3. **Listas e tabelas carregadas no cliente** (fetch no `useEffect`, SWR, paginação "ver mais") mostram
   `SkeletonList` ou `SkeletonTable` no lugar, nunca lista vazia nem "Carregando...".
4. **Imagens abaixo da dobra** com `loading="lazy"` e esqueleto atrás: use `<UserImage>` (já faz os dois) ou
   `<SkeletonImage>` como reserva de espaço. Só a imagem principal acima da dobra leva `priority`.
5. **Trecho lento da página fica em `<Suspense fallback={<Skeleton…/>}>`** para o resto aparecer logo
   (streaming): título, filtros e cartões rápidos renderizam; só o bloco que espera dados mostra esqueleto.
6. **Troca de rota dá feedback imediato.** A barra fina no topo (`NavigationProgress`, no layout raiz) cobre
   todo clique em link; a rota com dados lentos ainda precisa do `loading.tsx` para o esqueleto aparecer.

Acessibilidade: o `LoadingRegion` anuncia "Carregando ..." (leitor de tela) e marca `aria-busy`; os blocos são
`aria-hidden`. Com `prefers-reduced-motion: reduce` o brilho some e o bloco fica estático.

## Modelo de `loading.tsx`

```tsx
import { LoadingRegion, SkeletonPageHeader, SkeletonTabs, SkeletonTable } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="a lista de convidados" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={2} />
      <SkeletonTabs variant="chips" count={4} />
      <SkeletonTable columns={4} rows={8} avatar />
    </LoadingRegion>
  );
}
```

O contêiner (`className` do `LoadingRegion`) deve ter o MESMO `gap`/largura máxima da tela real.
O `loading.tsx` fica dentro do layout da rota: não repita sidebar nem cabeçalho do layout.

## Modelo de Suspense (streaming)

```tsx
// page.tsx (Server Component): o cabeçalho sai logo, o bloco lento entra quando os dados chegam
export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Finanças" />
      <Suspense fallback={<SkeletonStatGrid count={3} cols={3} />}>
        <Resumo />   {/* async: faz as consultas */}
      </Suspense>
    </div>
  );
}
```

Fallback de Suspense NÃO leva `LoadingRegion` se já está dentro de uma região de carregamento; fora de um
`loading.tsx`, envolva: `<Suspense fallback={<LoadingRegion label="o resumo"><SkeletonStatGrid /></LoadingRegion>}>`.

## Componentes

### `Skeleton` (`@/components/ui/skeleton`)
Bloco base (areia com brilho). Props de `div`. `aria-hidden="true"` por padrão. Dê tamanho e raio por classe.
```tsx
<Skeleton className="h-11 w-36 rounded-xl" />
```

### `LoadingRegion`
`role="status"`, `aria-live="polite"`, `aria-busy`, texto sr-only "Carregando {label}...", fade de 150ms.
- `label?: string`: o que carrega, sem o verbo ("os convidados"). Padrão "a página".
- `className`, `children`.

### `SkeletonText`
Linhas com a altura da linha real. `lines=3`, `size: "base"(24px)|"sm"(20px)`, `lastLineWidth="w-3/5"`, `className`.
```tsx
<SkeletonText lines={2} size="sm" lastLineWidth="w-1/3" />
```

### `SkeletonPageHeader`
Espelha o `PageHeader` (sobretítulo 16px, título 36/46px, descrição 24px, botões 44px).
`eyebrow=true`, `description=true`, `actions=0` (quantidade de botões), `breadcrumb=false`, `className`.
```tsx
<SkeletonPageHeader actions={2} />
```

### `SkeletonStat` / `SkeletonStatGrid`
Espelham `StatCard` / `StatGrid`. `SkeletonStat`: `hint=true`, `className` (ex.: `p-4 sm:p-5`).
`SkeletonStatGrid`: `count=4`, `cols: 2|3|4 = 4`, `hint=true`, `className` (sobrescreve as colunas se precisar).
```tsx
<SkeletonStatGrid count={3} cols={3} />
```

### `SkeletonCard`
Espelha o `Panel` (`p-5 md:p-6`, título de 28px). Sem `children` mostra 3 linhas.
`title=true`, `description=false`, `padded=true`, `className`, `children`.
```tsx
<SkeletonCard description><SkeletonChart /></SkeletonCard>
<SkeletonCard title={false} padded={false}><SkeletonList card={false} rows={4} /></SkeletonCard>
```

### `SkeletonList`
Linhas de 56px. `rows=6`, `leading: "avatar"|"icon"|"none"="avatar"`, `lines: 1|2 = 1`,
`trailing: "chip"|"action"|"none"="none"`, `card=true` (use `false` dentro de `SkeletonCard padded={false}`), `className`.
```tsx
<SkeletonList rows={5} leading="icon" lines={2} trailing="chip" />
```

### `SkeletonTable`
Tabela no computador (cabeçalho 44px, linhas 56px) e cartões no celular, escolhidos por CSS (`md`), como o `ResponsiveTable`.
`columns=4`, `rows=6`, `avatar=false`, `mobileFields=2`, `className`.
```tsx
<SkeletonTable columns={5} rows={8} avatar />
```

### `SkeletonForm`
Campos no formato do campo flutuante (48px; área de texto 96px) com o rótulo em repouso.
`fields: number | ("input"|"textarea")[] = 4`, `columns: 1|2 = 1`, `submit=true`, `className`.
```tsx
<SkeletonForm fields={["input", "input", "textarea"]} columns={2} />
```

### `SkeletonImage`
Proporção fixa, sem pulo de layout. `ratio: string|number = "4/3"`, `className` (raio: `rounded-[16px]`).
```tsx
<SkeletonImage ratio={1} />
```

### `SkeletonChart`
Barras no desenho do `RevenueChart`. `height=190`, `bars=6`, `variant: "bars"|"area"`, `legend=true`, `className`.

### `SkeletonTabs`
`variant: "segmented"` (faixa de areia, espelha `TabsNav`) ou `"chips"` (filtros em botões 44/40px). `count=4`, `className`.

### `SkeletonAvatar`
`size: "sm"(32)|"md"(40)|"lg"(56)|"xl"(80) = "md"`, `shape: "circle"|"square"`, `className`.

## Botões

- `<Button loading>`: spinner no centro, desabilitado, `aria-busy`; o rótulo fica invisível no lugar, então a largura não muda.
  Com `asChild` só marca `aria-busy`/`aria-disabled` (sem spinner).
- `<SubmitButton>` (`@/components/ui/submit-button`): `Button type="submit"` que liga `loading` sozinho enquanto o
  `<form action={serverAction}>` roda (`useFormStatus`). Formulário com `onSubmit`/estado próprio usa
  `<Button loading={pendente}>`.

## Imagens

`<UserImage src alt sizes>` (pai `relative`, com tamanho ou proporção): `loading="lazy"` (exceto `priority`) e esqueleto
com brilho atrás da foto até ela carregar ou falhar; volta ao trocar o `src`. `skeleton={false}` desliga.
Exemplo de uso: `wedding-site-view`, `public-gifts-client`, `vendor-detail-client`.
Para `next/image` direto fora do `UserImage`, ponha o pai com `ac-skeleton` (classe de `skeleton.css`) e a proporção fixa.

## Barra de navegação

`NavigationProgress` (layout raiz) acende a barra a cada clique em link interno e apaga quando a rota muda; só
aparece se demorar mais de 120ms. Navegação por código: `startNavigationProgress()` (de
`@/components/feedback/navigation-progress`) antes do `router.push/replace`. Link que não deve acendê-la: `data-no-progress`.
