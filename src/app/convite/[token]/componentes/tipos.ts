export type Visitante =
  | { kind: "anonymous" }
  | { kind: "blocked"; name: string; reason: string }
  | { kind: "member"; name: string; email: string; alreadyIn: boolean };
