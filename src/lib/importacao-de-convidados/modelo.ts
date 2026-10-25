// Importação de convidados: a planilha de exemplo para baixar.

export const NOME_DO_ARQUIVO_MODELO_DA_PLANILHA = "modelo-lista-de-convidados.csv";

/** CSV de exemplo (ponto e vírgula, que o Excel em português abre direto) com BOM para os acentos. */
export function csvDaPlanilhaModelo(): string {
  const lines = [
    "Nome;Telefone;E-mail;Acompanhantes;Grupo;Restrição alimentar",
    "Maria Exemplo;(11) 91234-5678;maria@exemplo.com;1;Família;Vegetariana",
    "João Exemplo;(21) 98765-4321;;0;Amigo/Colega;",
  ];
  return "﻿" + lines.join("\r\n") + "\r\n";
}
