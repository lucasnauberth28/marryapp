# Criativos de campanha (motion design)

Vídeos da campanha "Um sim. Muitos próximos passos." feitos com [Remotion](https://www.remotion.dev) (React).
Projeto à parte do app: tem o próprio `package.json`, não entra no build, no lint nem no CI.

## Peças
| Composição | Duração | Formatos |
|---|---|---|
| `Principal-<formato>-<casal>` | 20 s | `16x9` (1920×1080), `9x16` (1080×1920), `1x1` (1080×1080) |
| `Curto-<formato>-<casal>` | 6 s | os mesmos |

`<casal>` é `noivas` ou `noivos` (muda a foto do fechamento e os nomes nas telas). Sem som: a trilha entra na plataforma do anúncio.

Cenas: o sim → a avalanche de tarefas que vira o painel → o convite chegando no celular → as respostas → a assinatura.
As telas do produto são desenhadas em código com as cores e fontes da marca; os dados mostrados são de exemplo.

## Uso
```bash
cd criativos
npm install
npm run estudio                       # pré-visualização no navegador
node renderizar.mjs                   # todos os MP4 em out/
node renderizar.mjs Principal-9x16    # só as que começam assim
QUADROS=60,230 node renderizar.mjs quadros Curto-1x1   # PNGs para revisar
```
Com um Chrome headless já instalado, aponte `CHROME_HEADLESS` para ele (senão o Remotion baixa o dele).

## Fotos
Em `public/fotos`, geradas a partir dos prompts da campanha. A tela preta do celular recebe a interface por cima;
as máscaras `*-mascara.png` recortam exatamente a tela, para os dedos que a cobrem continuarem na frente.
