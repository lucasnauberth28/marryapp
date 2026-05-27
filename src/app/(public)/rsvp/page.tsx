import { RsvpClient } from "./rsvp-client";
import { getSettings } from "@/actions/settings-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { isAfter, startOfDay } from "date-fns";

export default async function RsvpPage() {
  const settings = await getSettings();
  
  const isExpired = settings.rsvpDeadline 
    ? isAfter(startOfDay(new Date()), startOfDay(new Date(settings.rsvpDeadline))) 
    : false;

  if (isExpired) {
    return (
      <div className="flex-1 w-full bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg border-0 rounded-3xl overflow-hidden text-center p-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-zinc-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">RSVP Encerrado</h2>
          <p className="text-zinc-500">
            A data limite para confirmação de presença já passou. 
            Se você precisa de ajuda, por favor entre em contato com os noivos diretamente.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-zinc-50 flex items-center justify-center p-4">
      <RsvpClient />
    </div>
  );
}
