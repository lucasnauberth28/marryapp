import { Metadata } from "next";
import { getGuests } from "@/actions/guest-actions";
import { GuestsClient } from "./guests-client";
import { verifyAdminSession } from "@/actions/auth-actions";

export const metadata: Metadata = {
  title: "Convidados | Lucas & Giovanna",
  description: "Gerencie a lista de convidados do casamento",
};

export default async function ConvidadosPage() {
  await verifyAdminSession();
  
  const guests = await getGuests();


  return (
    <div className="flex-1 p-8 pt-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GuestsClient initialGuests={guests} />
    </div>
  );
}
