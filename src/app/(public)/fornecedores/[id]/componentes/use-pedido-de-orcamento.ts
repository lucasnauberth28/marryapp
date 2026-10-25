// O formulário do pedido de orçamento: campos, envio e a confirmação que fica na tela.
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { criarPedidoDeOrcamento } from "@/actions/vitrine/pedido";
import type { FornecedorPublico } from "@/actions/vitrine/consulta";

export type TipoDeReuniao = "ONLINE" | "PRESENTIAL";

function useCamposDoPedido() {
  const [coupleName, setCoupleName] = useState("");
  const [couplePhone, setCouplePhone] = useState("");
  const [coupleEmail, setCoupleEmail] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [meetingType, setMeetingType] = useState<TipoDeReuniao>("ONLINE");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadLocation, setLeadLocation] = useState("");
  const [leadBudget, setLeadBudget] = useState("");
  const limpar = () => {
    setCoupleName("");
    setCouplePhone("");
    setCoupleEmail("");
    setGuestCount("");
    setLeadMessage("");
    setLeadLocation("");
    setLeadBudget("");
  };
  return { coupleName, setCoupleName, couplePhone, setCouplePhone, coupleEmail, guestCount, weddingDate, setWeddingDate, meetingType, setMeetingType, leadMessage, leadLocation, setLeadLocation, leadBudget, setLeadBudget, limpar };
}

export function usePedidoDeOrcamento(vendor: Pick<FornecedorPublico, "id" | "companyName">) {
  const campos = useCamposDoPedido();
  const [isPending, startTransition] = useTransition();
  // Pedido enviado: a confirmação fica na tela (um aviso passageiro some antes de ser lido).
  const [sentTo, setSentTo] = useState<{ coupleName: string } | null>(null);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campos.coupleName || !campos.couplePhone) {
      toast.error("Preencha seu nome e WhatsApp para o fornecedor poder responder.");
      return;
    }
    const toastId = toast.loading(`Enviando o pedido para ${vendor.companyName}...`);
    startTransition(async () => {
      const res = await criarPedidoDeOrcamento({
        vendorId: vendor.id,
        coupleName: campos.coupleName,
        couplePhone: campos.couplePhone,
        coupleEmail: campos.coupleEmail,
        guestCount: campos.guestCount ? parseInt(campos.guestCount, 10) : undefined,
        weddingDate: campos.weddingDate ? new Date(campos.weddingDate) : undefined,
        message: campos.leadMessage,
        meetingType: campos.meetingType,
        location: campos.leadLocation,
        budget: campos.leadBudget,
      });
      if (res.success) {
        toast.dismiss(toastId);
        setSentTo({ coupleName: campos.coupleName });
        campos.limpar();
      } else toast.error(res.error || "Não conseguimos enviar o pedido. Tente de novo.", { id: toastId });
    });
  };

  return { campos, isPending, sentTo, setSentTo, enviar };
}

export type CamposDoPedido = ReturnType<typeof usePedidoDeOrcamento>["campos"];
