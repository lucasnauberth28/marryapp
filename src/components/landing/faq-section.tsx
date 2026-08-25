"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "Como funciona a taxa zero (0%) no Pix dos noivos?",
    a: "Nos planos Classic e VIP, todo presente pago por Pix cai 100% integral na sua conta bancária sem qualquer desconto ou comissão. No plano básico, cobramos uma pequena taxa de 2,99% por presente recebido.",
  },
  {
    q: "Como meus convidados confirmam presença (RSVP)?",
    a: "Eles podem confirmar pelo site oficial do casamento em 1 clique ou diretamente respondendo aos lembretes automáticos com botões interativos enviados no WhatsApp oficial.",
  },
  {
    q: "Posso personalizar as cores, fotos e textos do site?",
    a: "Sim! O Construtor No-Code do MarryApp permite alterar cores da paleta, tipografias elegantes, fotos do casal, ordem dos blocos e guia de trajes sem precisar programar nada.",
  },
  {
    q: "Como os fornecedores recebem orçamentos e agendamentos?",
    a: "Os noivos solicitam orçamentos direto no marketplace. O fornecedor recebe notificação em tempo real com nome, data do casamento e opção de agendar reuniões online (Google Meet) ou presenciais.",
  },
];

export function FaqSection() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <section className="py-20 max-w-4xl mx-auto px-6 font-sans">
      <div className="text-center mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D45]">
          Tire suas Dúvidas
        </span>
        <h2 className="text-3xl font-extrabold text-stone-900 font-serif mt-1">
          Perguntas Frequentes
        </h2>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => {
          const isOpen = openFaqIndex === idx;

          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs transition-all"
            >
              <button
                onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-serif font-bold text-base text-stone-900 cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-[#8C6D45]" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
