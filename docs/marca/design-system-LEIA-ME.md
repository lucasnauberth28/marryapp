# Referência para implementação

Abra referencia-componentes.html localmente com as pastas do kit preservadas. O arquivo demonstra tema claro/escuro, retorno de ação, validação de campo e entrada da marca. Não é o código da aplicação de produção e não envia dados.

aceito-design-tokens.json documenta medidas e cores. aceito-ui.css contém os tokens semânticos e os componentes de referência. Os valores de light e dark_overrides preservam o protótipo recebido. As quatro cores error/errorSurface são complementos funcionais identificados no JSON; não pertencem à paleta do logotipo.

- Grade de 4 px, priorizando 8 / 16 / 24 / 32 / 48 / 64.
- Controles com 48 px de altura mínima; rótulos sempre visíveis.
- Foco de 2 px, com afastamento de 3 px; testar por teclado no produto real.
- Mensagens de estado com texto e sinal visual; cor nunca é a única informação.
- Corpo 16 px / 1,5; títulos Urbanist, texto Geist. Zoom deve preservar o conteúdo.
- Erros ligados ao campo por aria-describedby e aria-invalid; retornos por região de status.
- Imagens decorativas com alt vazio; ícones em botões só com nome acessível.
- Movimento: feedback 160 ms; transição 240 ms; entrada de marca 700 ms; deslocamento máximo 8 px. Desabilitar animação com prefers-reduced-motion. Sem som automático.
- O SVG do logotipo não muda de proporção durante a animação. O estado final é o arquivo mestre.

A presença dos tokens não comprova acessibilidade do produto inteiro; valide componentes no contexto de implementação, inclusive leitura assistiva e uso em telas pequenas.
