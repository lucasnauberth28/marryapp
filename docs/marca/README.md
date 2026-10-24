# Marca Aceito: Kit v2.0 (B, Esculpido), 23.10.2026

O app usa o Kit de Marca v2.0. Esta pasta guarda o que a equipe consulta; os arquivos de produção estão em `public/brand`, `public/icons`, `src/app/icon.svg` e `src/app/favicon.ico`.

| O quê | Onde está no repositório |
|---|---|
| Logotipos oficiais em SVG (68 artes, curvas) | `public/brand/aceito-*.svg` |
| Logotipo inline, nas cores do tema | `src/components/brand/logo.tsx` e `logo-paths.ts` (o teste `logo-paths.test.ts` confere contra os SVGs) |
| Favicon, ícones do app, imagem de compartilhamento | `src/app/icon.svg`, `src/app/favicon.ico`, `public/icons/*`, `public/brand/aceito-og.png` |
| Ícones utilitários e arcos | `public/brand/icones`, `public/brand/elementos` |
| Fontes (Urbanist e Geist, SIL OFL) | `src/app/fonts` (com as licenças) |
| Voz, mensagens e microcopy | `docs/marca/Plataforma_de_Marca.md`, `docs/marca/Guia_de_Voz_e_Microcopy.md` |
| Tokens e contrastes | `docs/marca/aceito-design-tokens.json`, `docs/marca/contraste-interface.csv`; no código, `src/app/globals.css` |
| Assinatura de e-mail da equipe | `docs/marca/assinatura-email.html` (hospede a imagem e troque o caminho por URL HTTPS) |

Regras que o código segue: uma cor por logotipo; versão clara com geometria própria (compensação óptica); nunca redigitar o nome "aceito" em texto; cores de estado (verde, erro) são funcionais, não cores do logo.

Ainda não recebidos ou não aplicados: modelos de redes sociais, papelaria e EPS de impressão (ficam com o kit original); fotos finais com direitos confirmados.
