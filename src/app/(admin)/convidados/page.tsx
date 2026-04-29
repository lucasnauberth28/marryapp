import { Metadata } from "next";
import { getGuests } from "@/actions/guest-actions";
import { GuestsClient } from "./guests-client";

export const metadata: Metadata = {
  title: "Convidados | MarryApp",
  description: "Gerencie a lista de convidados do seu casamento",
};

export default async function ConvidadosPage() {
  const guests = await getGuests();

  return (
    <div className="flex-1 p-8 pt-6 w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GuestsClient initialGuests={guests} />
    </div>
  );
}
