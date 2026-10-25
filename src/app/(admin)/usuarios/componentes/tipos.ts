export interface ItemDePessoa {
  id: string;
  name: string;
  username: string;
  roleId: string;
  role?: { name: string } | null;
}

export interface OpcaoDePerfil {
  id: string;
  name: string;
}

export interface DadosDaPessoa {
  name: string;
  username: string;
  password: string;
  roleId: string;
}
