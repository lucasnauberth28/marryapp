import { CalendarClock, CheckCircle2, Gift, Globe, LayoutGrid, Mail, MessageCircle, Store, Users, Wallet } from "lucide-react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { CartaoDeTarefa } from "../componentes/cartao";
import { Cena } from "../componentes/cena";
import { Frase } from "../componentes/frase";
import { MiniPainel } from "../componentes/painel";
import { progresso } from "../movimento";
import { COR, useFormato, type TipoDeFormato } from "../tema";

const TAREFAS = [
  { icone: Users, texto: "Lista de convidados" },
  { icone: Globe, texto: "Site do casamento" },
  { icone: Mail, texto: "Convites" },
  { icone: CheckCircle2, texto: "Confirmações" },
  { icone: Gift, texto: "Presentes em dinheiro" },
  { icone: LayoutGrid, texto: "Mesas" },
  { icone: CalendarClock, texto: "Cronograma" },
  { icone: Store, texto: "Fornecedores" },
  { icone: Wallet, texto: "Orçamento" },
  { icone: MessageCircle, texto: "Mensagens" },
];

const ARRANJO: Record<TipoDeFormato, { colunas: number; linhas: number; area: [number, number, number, number]; titulo: number; painel: [number, number]; larguraDoPainel: number; tamanho: number }> = {
  horizontal: { colunas: 3, linhas: 4, area: [0.1, 0.3, 0.9, 0.94], titulo: 0.1, painel: [0.5, 0.62], larguraDoPainel: 1080, tamanho: 96 },
  vertical: { colunas: 2, linhas: 5, area: [0.04, 0.3, 0.96, 0.8], titulo: 0.15, painel: [0.5, 0.56], larguraDoPainel: 940, tamanho: 96 },
  quadrado: { colunas: 2, linhas: 5, area: [0.04, 0.24, 0.96, 0.96], titulo: 0.07, painel: [0.5, 0.6], larguraDoPainel: 900, tamanho: 80 },
};

/** Onde cada cartão cai: uma grade com ruído, sempre igual entre renderizações (semente fixa). */
function posicoes(tipo: TipoDeFormato) {
  const { colunas, linhas, area } = ARRANJO[tipo];
  const [x0, y0, x1, y1] = area;
  const slots = Array.from({ length: colunas * linhas }, (_, i) => i).sort((a, b) => random(`ordem-${tipo}-${a}`) - random(`ordem-${tipo}-${b}`));
  return TAREFAS.map((_, i) => {
    const slot = slots[i];
    const c = slot % colunas, l = Math.floor(slot / colunas);
    const jx = (random(`x-${tipo}-${i}`) - 0.5) * 0.3, jy = (random(`y-${tipo}-${i}`) - 0.5) * 0.3;
    return { x: x0 + ((c + 0.5 + jx) / colunas) * (x1 - x0), y: y0 + ((l + 0.5 + jy) / linhas) * (y1 - y0), giro: (random(`g-${tipo}-${i}`) - 0.5) * 12 };
  });
}

/** "Muitos próximos passos." espalha as tarefas pela tela; elas convergem e viram o painel: "Num painel só." */
export function CenaOrganizar({ duracao, nomes }: { duracao: number; nomes: string }) {
  const frame = useCurrentFrame();
  const { tipo, largura, altura, u } = useFormato();
  const arranjo = ARRANJO[tipo];
  const juntar = Math.round(duracao * 0.45);
  const [px, py] = arranjo.painel;
  const titulo = { left: largura * 0.06, right: largura * 0.06, top: altura * arranjo.titulo };
  return (
    <Cena duracao={duracao} fundo={COR.linho}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 60%, ${COR.nevoa} 0%, ${COR.linho} 70%)` }} />
      <Frase texto="Muitos próximos passos." inicio={4} saida={juntar - 4} tamanho={arranjo.tamanho * u} estilo={titulo} />
      {posicoes(tipo).map((p, i) => {
        const entra = progresso(frame, 6 + i * 3, 16);
        const vai = progresso(frame, juntar + i * 1.2, 16);
        const x = interpolate(vai, [0, 1], [p.x, px]) * largura;
        const y = interpolate(vai, [0, 1], [p.y, py]) * altura + Math.sin((frame + i * 20) / 18) * 6 * u * (1 - vai);
        const escala = interpolate(entra, [0, 1], [0.7, 1]) * interpolate(vai, [0, 1], [1, 0.45]);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, opacity: entra * (1 - vai), transform: `translate(-50%, -50%) rotate(${p.giro * (1 - vai)}deg) scale(${escala})` }}>
            <CartaoDeTarefa icone={TAREFAS[i].icone} texto={TAREFAS[i].texto} u={u} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: px * largura, top: py * altura, opacity: progresso(frame, juntar + 8, 14), transform: `translate(-50%, -50%) scale(${interpolate(progresso(frame, juntar + 8, 22), [0, 1], [0.9, 1])})` }}>
        <MiniPainel nomes={nomes} u={u} inicio={juntar + 10} largura={arranjo.larguraDoPainel * u} />
      </div>
      <Frase texto="Num painel só." inicio={juntar + 14} tamanho={arranjo.tamanho * u} estilo={titulo} />
    </Cena>
  );
}
