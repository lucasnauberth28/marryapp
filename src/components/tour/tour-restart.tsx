"use client";

import { Compass } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTour } from "./panel-tour-provider";

/** Item "Ver o passo a passo" do menu da conta. Some quando a conta não tem o passo a passo. */
export function TourMenuItem() {
  const { available, start } = useTour();
  if (!available) return null;
  return (
    <DropdownMenuItem onSelect={() => start()} className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-tinta">
      <Compass className="h-4 w-4 text-tinta-suave" aria-hidden="true" /> Ver o passo a passo
    </DropdownMenuItem>
  );
}

/** Cartão das Configurações para rever o passo a passo de novo, quando quiser. */
export function TourSettingsCard() {
  const { available, start } = useTour();
  if (!available) return null;
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Passo a passo do painel</CardTitle>
        <CardDescription>Revejam onde fica cada área do painel e o que dá para fazer em cada uma.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => start()}>
          Ver o passo a passo de novo
        </Button>
      </CardContent>
    </Card>
  );
}
