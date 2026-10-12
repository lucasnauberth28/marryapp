-- Passo a passo do painel, por pessoa (o casal e o par convidado têm um cada): quando foi concluído ou pulado,
-- qual versão da apresentação a pessoa já resolveu e se dispensou a lista "Primeiros passos" do Resumo.
-- Contas que já existem entram com a versão 1: o passo a passo não aparece de surpresa para elas
-- (continua disponível em "Ver o passo a passo"). Só acrescenta colunas; nada é removido.
-- Tudo ou nada: se algum passo falhar, o banco volta ao estado anterior.
BEGIN;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "panelTourVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "panelTourCompletedAt" TIMESTAMP(3),
ADD COLUMN     "panelTourSkippedAt" TIMESTAMP(3),
ADD COLUMN     "panelChecklistDismissedAt" TIMESTAMP(3);

-- Contas anteriores a esta migration não levam o passo a passo sozinhas (só as criadas depois dela)
UPDATE "users" SET "panelTourVersion" = 1;

COMMIT;
