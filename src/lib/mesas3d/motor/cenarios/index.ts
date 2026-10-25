// Construtores dos cenários (o ambiente; as mesas vêm depois), escolhidos pelo id do cenário.
import type { DefinicaoDoCenario, IdDoCenario } from "../../scenarios.ts";
import type { ContextoDoMotor } from "../tipos.ts";
import { montarSalaoClassico } from "./classico.ts";
import { montarJardim } from "./jardim.ts";
import { montarCeleiroRustico } from "./rustico.ts";

type Construtor = (ctx: ContextoDoMotor, c: DefinicaoDoCenario, sala: [number, number]) => void;

const CONSTRUTORES: Record<IdDoCenario, Construtor> = {
  jardim: (ctx, c, sala) => montarJardim(ctx, c, sala),
  classico: (ctx, _c, sala) => montarSalaoClassico(ctx, sala),
  rustico: (ctx, _c, sala) => montarCeleiroRustico(ctx, sala),
};

export function montarCenario(ctx: ContextoDoMotor, c: DefinicaoDoCenario, sala: [number, number]) {
  CONSTRUTORES[c.id](ctx, c, sala);
}
